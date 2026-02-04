/* ==========================
   SEARCH.JS
========================== */

const BACKEND_URL = "https://musten-backend.onrender.com/songs";
const BACKEND_BASE = "https://musten-backend.onrender.com";
let allSongs = [];
let filteredSongs = [];
let currentPage = 1;
let hasMoreSongs = true;
let isLoading = false;
let totalSongs = 0;
let isSearchActive = false;

/* ==========================
   LOCK BACKGROUND
========================== */
document.body.style.overflow = "hidden";
document.documentElement.style.overflow = "hidden";

/* ==========================
   INJECT CSS FOR SEARCH PAGE
========================== */
const style = document.createElement("style");
style.innerHTML = `
  .search-results {
    position: fixed;
    top: 300px;
    bottom: 140px;
    left: 0;
    right: 0;
    overflow-y: auto;
    padding: 20px;
  }

  .search-loading {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 12px;
    z-index: 1000;
  }

  .search-loader {
    width: 80px;
    height: 80px;
    border: 8px solid rgba(255,255,255,0.3);
    border-top: 8px solid chartreuse;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }

  .search-loader-text {
    color: white;
    font-size: 30px;
    font-weight: 900;
  }

  .search-no-results {
    text-align: center;
    color: white;
    font-size: 25px;
    font-weight: 900;
    margin-top: 50px;
    font-family: sans-serif;
  }

  .search-all-songs-title {
    text-align: center;
    color: chartreuse;
    font-size: 30px;
    font-weight: 900;
    margin-bottom: 30px;
    font-family: sans-serif;
    padding: 10px;
  }

  .search-cards-container {
    display: flex;
    flex-direction: column;
    gap: 40px;
    padding-bottom: 20px;
  }

  .search-card {
    background: linear-gradient(yellow, #3abe10, yellow, red, yellow);
    border-radius: 18px;
    height: 30vh;
    width: 50vh;
    margin: 0 auto;
    overflow: hidden;
    position: relative;
    cursor: pointer;
    aspect-ratio: 16 / 9;
  }

  .search-card img {
    width: 100%;
    height: 100%;
    object-fit: contain;
  }

  .search-title {
    position: absolute;
    bottom: 8px;
    left: 8px;
    right: 8px;
    font-family: sans-serif;
    color: black;
    font-size: 30px;
    font-weight: 900;
    height: 40px;
    text-align: center;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    z-index: 2;
    background: white;
    padding: 6px;
    border-radius: 10px;
  }

  .search-play-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 40px;
    background: rgba(0,0,0,.4);
    color: white;
    opacity: 0;
    transition: .25s;
  }

  .search-card:hover .search-play-overlay {
    opacity: 1;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  /* Custom scrollbar */
  .search-results::-webkit-scrollbar {
    width: 8px;
  }

  .search-results::-webkit-scrollbar-thumb {
    background: chartreuse;
    border-radius: 10px;
  }

  .search-results::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
  }

  .search-info {
    text-align: center;
    color: chartreuse;
    font-size: 18px;
    margin: 10px 0;
    font-family: sans-serif;
  }

  .search-loading-more {
    text-align: center;
    padding: 20px;
    color: chartreuse;
    display: none;
  }

  .search-retry-btn {
    background: chartreuse;
    color: black;
    border: none;
    padding: 10px 20px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    margin-top: 10px;
  }
`;
document.head.appendChild(style);

/* ==========================
   CREATE RESULTS CONTAINER
========================== */
const resultsContainer = document.createElement("div");
resultsContainer.className = "search-results";
document.body.appendChild(resultsContainer);

/* ==========================
   CREATE LOADER
========================== */
const loaderContainer = document.createElement("div");
loaderContainer.className = "search-loading";

const loader = document.createElement("div");
loader.className = "search-loader";

const loaderText = document.createElement("div");
loaderText.className = "search-loader-text";
loaderText.textContent = "Loading songs...";

loaderContainer.append(loader, loaderText);
document.body.appendChild(loaderContainer);

/* ==========================
   CREATE LOAD MORE INDICATOR
========================== */
const loadMoreIndicator = document.createElement("div");
loadMoreIndicator.className = "search-loading-more";
loadMoreIndicator.textContent = "Loading more songs...";
resultsContainer.appendChild(loadMoreIndicator);

/* ==========================
   HELPER FUNCTIONS
========================== */
function extractTitleFromAudio(audioPath) {
  if (!audioPath) return "Unknown Title";
  const cleanPath = audioPath.split("?")[0];
  const fileName = cleanPath.split("/").pop();
  
  try {
    const decoded = decodeURIComponent(fileName);
    return decoded.replace(/\.[^/.]+$/, "");
  } catch (e) {
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    return cleanName.replace(/%20/g, ' ').replace(/%2C/g, ',').replace(/%27/g, "'");
  }
}

function showLoading() {
  loaderContainer.style.display = "flex";
}

function hideLoading() {
  loaderContainer.style.display = "none";
}

function showLoadMore() {
  loadMoreIndicator.style.display = "block";
}

function hideLoadMore() {
  loadMoreIndicator.style.display = "none";
}

function showError(message) {
  resultsContainer.innerHTML = `
    <div class="search-no-results">
      ${message}
      <button class="search-retry-btn" onclick="retryFetchAll()">Retry</button>
    </div>
  `;
}

/* ==========================
   GET PROXIED URLS
========================== */
function getProxiedAudioUrl(githubUrl) {
  if (!githubUrl) return '';
  
  // If URL is already a proxy URL, use it as is
  if (githubUrl.includes('/audio?url=')) {
    return githubUrl;
  }
  
  // Convert GitHub URL to backend proxy URL
  const encodedUrl = encodeURIComponent(githubUrl);
  return `${BACKEND_BASE}/audio?url=${encodedUrl}`;
}

function getProxiedThumbnailUrl(githubUrl) {
  if (!githubUrl) return 'https://via.placeholder.com/300x200/333/fff?text=No+Image';
  
  // If URL is already a proxy URL, use it as is
  if (githubUrl.includes('/thumbnail?url=')) {
    return githubUrl;
  }
  
  // Convert GitHub URL to backend proxy URL
  const encodedUrl = encodeURIComponent(githubUrl);
  return `${BACKEND_BASE}/thumbnail?url=${encodedUrl}`;
}

/* ==========================
   CREATE SONG CARD WITH PROXIED URLS
========================== */
function createSearchCard(song, parent) {
  const card = document.createElement("div");
  card.className = "search-card";

  // Get proxied URLs
  const audioUrl = getProxiedAudioUrl(song.audio || song.audioProxy || song.audio);
  const thumbnailUrl = getProxiedThumbnailUrl(song.thumbnail || song.thumbnailProxy || song.thumbnail);

  const img = document.createElement("img");
  img.src = thumbnailUrl;
  img.alt = song.name || "Song cover";
  img.onerror = function() {
    this.src = 'https://via.placeholder.com/300x200/333/fff?text=No+Image';
  };

  const overlay = document.createElement("div");
  overlay.className = "search-play-overlay";
  overlay.innerHTML = `<i class="fa-solid fa-play"></i>`;

  const title = document.createElement("div");
  title.className = "search-title";
  title.textContent = song.name || extractTitleFromAudio(song.audio) || "Unknown Title";

  card.append(img, overlay, title);
  parent.appendChild(card);

  card.onclick = () => {
    // Close any existing player window
    if (window.playerWindow && !window.playerWindow.closed) {
      window.playerWindow.close();
    }
    
    // Create URL parameters
    const params = new URLSearchParams();
    params.append('name', encodeURIComponent(title.textContent));
    
    // Use proxied audio URL
    if (audioUrl) {
      params.append('audio', encodeURIComponent(audioUrl));
    } else if (song.audio) {
      params.append('audio', encodeURIComponent(song.audio));
    }
    
    // Use proxied thumbnail URL
    if (thumbnailUrl && !thumbnailUrl.includes('placeholder.com')) {
      params.append('thumbnail', encodeURIComponent(thumbnailUrl));
    } else if (song.thumbnail) {
      params.append('thumbnail', encodeURIComponent(song.thumbnail));
    }
    
    // Add song ID if available
    if (song.id) {
      params.append('id', song.id);
    }
    
    // Add timestamp to prevent caching
    params.append('t', Date.now());
    
    // Log for debugging
    console.log("Opening player with proxied URLs");
    
    // Open player
    window.playerWindow = window.open(`view.html?${params.toString()}`, "_blank");
    
    // Force the new window to focus
    if (window.playerWindow) {
      window.playerWindow.focus();
    }
  };
}

/* ==========================
   DISPLAY SONGS
========================== */
function displaySongs() {
  // Clear only the cards container, keep load more indicator
  const existingContainer = resultsContainer.querySelector('.search-cards-container');
  if (existingContainer) {
    existingContainer.remove();
  }
  
  // Also remove info if exists
  const existingInfo = resultsContainer.querySelector('.search-info');
  if (existingInfo) {
    existingInfo.remove();
  }
  
  // Show no results message
  if (filteredSongs.length === 0) {
    if (isSearchActive) {
      resultsContainer.innerHTML = `
        <div class="search-no-results">
          No songs found for your search.
        </div>
      `;
    } else {
      resultsContainer.innerHTML = `
        <div class="search-no-results">
          No songs found.
        </div>
      `;
    }
    return;
  }

  // Create container for all cards
  const cardsContainer = document.createElement("div");
  cardsContainer.className = "search-cards-container";
  
  // Add info about total songs
  const infoDiv = document.createElement("div");
  infoDiv.className = "search-info";
  if (isSearchActive) {
    infoDiv.textContent = `Found ${filteredSongs.length} songs matching your search`;
  } else {
    infoDiv.textContent = `Loaded ${allSongs.length} of ${totalSongs} songs`;
  }
  cardsContainer.appendChild(infoDiv);

  // Sort by newest first
  filteredSongs.sort((a, b) => {
    if (a.createdAt && b.createdAt) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    }
    return 0;
  });

  // Create individual cards with proxied URLs
  filteredSongs.forEach(song => {
    createSearchCard(song, cardsContainer);
  });
  
  resultsContainer.appendChild(cardsContainer);
  
  // Show/hide load more indicator
  if (hasMoreSongs && !isSearchActive) {
    showLoadMore();
  } else {
    hideLoadMore();
  }
}

/* ==========================
   FETCH SONGS BATCH
========================== */
async function fetchSongsBatch(page) {
  if (isLoading) return;
  
  isLoading = true;
  
  try {
    const url = `${BACKEND_URL}?page=${page}&limit=20&_t=${Date.now()}`; // Fetch 20 at a time
    console.log(`Fetching search page ${page}...`);
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    
    const data = await res.json();
    
    // Handle both old and new response formats
    const songs = data.songs || data;
    
    if (!songs || songs.length === 0) {
      hasMoreSongs = false;
      hideLoadMore();
      return;
    }
    
    // Add songs to allSongs array
    songs.forEach(song => {
      if (!song.name && song.audio) {
        song.name = extractTitleFromAudio(song.audio);
      }
      allSongs.push(song);
    });
    
    // Update totals
    totalSongs = data.total || allSongs.length;
    hasMoreSongs = data.hasMore !== undefined ? data.hasMore : songs.length === 20;
    
    // Update filtered songs (if not searching)
    if (!isSearchActive) {
      filteredSongs = [...allSongs];
      displaySongs();
    }
    
    // Auto-fetch next page after 1 second if not searching
    if (hasMoreSongs && !isSearchActive) {
      setTimeout(() => {
        currentPage++;
        fetchSongsBatch(currentPage);
      }, 1000);
    }
    
  } catch (error) {
    console.error("Error fetching songs:", error);
    showError(`Failed to load songs: ${error.message}`);
    hasMoreSongs = false;
    hideLoadMore();
  } finally {
    isLoading = false;
  }
}

/* ==========================
   FETCH ALL SONGS (START)
========================== */
async function fetchAllSongs() {
  // Reset variables
  allSongs = [];
  filteredSongs = [];
  currentPage = 1;
  hasMoreSongs = true;
  isSearchActive = false;
  
  showLoading();
  loaderText.textContent = "Loading songs...";
  
  // Start fetching first batch
  await fetchSongsBatch(currentPage);
  
  hideLoading();
}

/* ==========================
   SEARCH FUNCTION
========================== */
function performSearch(searchTerm) {
  const trimmedTerm = searchTerm.trim();
  
  if (trimmedTerm === '') {
    // Empty search - show all songs
    isSearchActive = false;
    filteredSongs = [...allSongs];
    displaySongs();
    
    // Continue loading if more songs available
    if (hasMoreSongs && !isLoading) {
      currentPage++;
      fetchSongsBatch(currentPage);
    }
  } else {
    // Filter songs based on search term
    isSearchActive = true;
    filteredSongs = allSongs.filter(song => {
      const songName = (song.name || "").toLowerCase();
      const searchLower = trimmedTerm.toLowerCase();
      return songName.includes(searchLower);
    });

    // Show search results
    displaySongs();
  }
}

/* ==========================
   SETUP SEARCH INPUT
========================== */
function setupSearchInput() {
  const searchInput = document.querySelector('.search');
  
  if (!searchInput) {
    console.error("Search input not found!");
    return;
  }

  // Clear initial placeholder text on focus
  searchInput.addEventListener('focus', function() {
    if (this.value === this.defaultValue) {
      this.value = '';
    }
  });

  // Add input event listener for live search
  searchInput.addEventListener('input', function() {
    const searchTerm = this.value;
    performSearch(searchTerm);
  });

  // Add Enter key support
  searchInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      performSearch(this.value);
    }
  });

  // Show all songs when user clears the input
  searchInput.addEventListener('keyup', function(e) {
    if (this.value === '') {
      performSearch('');
    }
  });
}

/* ==========================
   RETRY FUNCTION
========================== */
window.retryFetchAll = function() {
  fetchAllSongs();
};

/* ==========================
   INFINITE SCROLL
========================== */
let isScrolling = false;
resultsContainer.addEventListener('scroll', () => {
  if (isLoading || isSearchActive || !hasMoreSongs) return;
  
  const scrollPosition = resultsContainer.scrollTop + resultsContainer.clientHeight;
  const scrollHeight = resultsContainer.scrollHeight;
  
  // Load more when near bottom
  if (scrollPosition >= scrollHeight - 200) {
    if (!isScrolling) {
      isScrolling = true;
      showLoadMore();
      currentPage++;
      fetchSongsBatch(currentPage);
      
      setTimeout(() => {
        isScrolling = false;
      }, 1000);
    }
  }
});

/* ==========================
   INITIALIZE
========================== */
window.addEventListener('DOMContentLoaded', () => {
  setupSearchInput();
  fetchAllSongs();
});

// Make functions available globally for debugging
window.getProxiedAudioUrl = getProxiedAudioUrl;
window.getProxiedThumbnailUrl = getProxiedThumbnailUrl;