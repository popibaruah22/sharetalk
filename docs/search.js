/* ==========================
   SEARCH.JS
========================== */

const BACKEND_URL = "https://musten-backend.onrender.com/songs";
let allSongs = [];
let filteredSongs = [];

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
   HELPER FUNCTIONS
========================== */
function extractTitleFromAudio(audioPath) {
  if (!audioPath) return "Unknown Title";
  const cleanPath = audioPath.split("?")[0];
  const fileName = cleanPath.split("/").pop();
  return decodeURIComponent(fileName.replace(/\.[^/.]+$/, ""));
}

function showLoading() {
  loaderContainer.style.display = "flex";
  resultsContainer.innerHTML = "";
}

function hideLoading() {
  loaderContainer.style.display = "none";
}

function showNoResults() {
  resultsContainer.innerHTML = `
    <div class="search-no-results">
      No songs found. Try a different search term.
    </div>
  `;
}

/* ==========================
   CREATE SONG CARD
========================== */
function createSearchCard(song, parent) {
  const card = document.createElement("div");
  card.className = "search-card";

  const img = document.createElement("img");
  img.src = song.thumbnail || "https://via.placeholder.com/300x200/333/fff?text=No+Image";

  const overlay = document.createElement("div");
  overlay.className = "search-play-overlay";
  overlay.innerHTML = `<i class="fa-solid fa-play"></i>`;

  const title = document.createElement("div");
  title.className = "search-title";
  title.textContent = song.name || extractTitleFromAudio(song.audio) || "Unknown Title";

  card.append(img, overlay, title);
  parent.appendChild(card);

  card.onclick = () => {
    const params = new URLSearchParams({
      name: title.textContent,
      audio: song.audio,
      thumbnail: song.thumbnail || ""
    });
    window.open(`view.html?${params}`, "_blank");
  };
}

/* ==========================
   DISPLAY RESULTS
========================== */
function displaySearchResults(isSearching = false) {
  resultsContainer.innerHTML = "";
  
  // Show no results message when searching and no matches
  if (isSearching && filteredSongs.length === 0) {
    showNoResults();
    return;
  }
  
  // Show all songs (not searching or empty search)
  if (filteredSongs.length === 0) {
    showNoResults();
    return;
  }

  // Create container for all cards
  const cardsContainer = document.createElement("div");
  cardsContainer.className = "search-cards-container";
  
  // Add title for all songs view
  if (!isSearching) {
    const title = document.createElement("div");
    title.className = "search-all-songs-title";
    title.textContent = "";
    resultsContainer.appendChild(title);
  }

  // Sort by newest first (assuming _id contains timestamp)
  filteredSongs.sort((a, b) => {
    if (a._id && b._id) return b._id.localeCompare(a._id);
    return 0;
  });

  // Create individual cards
  filteredSongs.forEach(song => {
    if (!song.name && song.audio) {
      song.name = extractTitleFromAudio(song.audio);
    }
    createSearchCard(song, cardsContainer);
  });
  
  resultsContainer.appendChild(cardsContainer);
}

/* ==========================
   SEARCH FUNCTION
========================== */
function performSearch(searchTerm) {
  const trimmedTerm = searchTerm.trim();
  
  if (trimmedTerm === '') {
    // Empty search - show all songs
    filteredSongs = [...allSongs];
    displaySearchResults(false); // Not searching
  } else {
    // Filter songs based on search term
    filteredSongs = allSongs.filter(song => {
      const songName = (song.name || extractTitleFromAudio(song.audio) || "").toLowerCase();
      const searchLower = trimmedTerm.toLowerCase();
      return songName.includes(searchLower);
    });

    // Show loading only if we have a search term
    showLoading();
    setTimeout(() => {
      hideLoading();
      displaySearchResults(true); // Is searching
    }, 300);
  }
}

/* ==========================
   FETCH ALL SONGS
========================== */
async function fetchAllSongs() {
  try {
    showLoading();
    loaderText.textContent = "Loading songs...";
    
    const res = await fetch(BACKEND_URL);
    if (!res.ok) throw new Error("Failed to fetch songs");
    
    allSongs = await res.json();
    
    // Add names to songs if missing
    allSongs.forEach(song => {
      if (!song.name && song.audio) {
        song.name = extractTitleFromAudio(song.audio);
      }
    });

    hideLoading();
    
    // Initially show all songs
    filteredSongs = [...allSongs];
    displaySearchResults(false); // Not searching
    
  } catch (error) {
    console.error("Error fetching songs:", error);
    loaderText.textContent = "Failed to load songs";
    setTimeout(() => {
      hideLoading();
      showNoResults();
    }, 1000);
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
   INITIALIZE
========================== */
window.addEventListener('DOMContentLoaded', () => {
  setupSearchInput();
  fetchAllSongs();
});
