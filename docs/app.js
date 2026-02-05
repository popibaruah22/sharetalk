/* ==========================
   CONFIG
========================== */
const BACKEND_URL = "https://musten-backend.onrender.com/songs";
const BACKEND_BASE_URL = "https://musten-backend.onrender.com";

/* ==========================
   LOCK BACKGROUND
========================== */
document.body.style.overflow = "hidden";
document.documentElement.style.overflow = "hidden";

/* ==========================
   TAB MANAGEMENT
========================== */
let currentTab = 'music';

function switchTab(tabName) {
  document.querySelectorAll('.app-tab').forEach(tab => {
    tab.classList.remove('active-tab');
  });
  
  if (tabName === 'music') {
    document.getElementById('music-tab').classList.add('active-tab');
    document.getElementById('music-content').classList.add('active');
    document.getElementById('images-content').classList.remove('active');
    currentTab = 'music';
  } else if (tabName === 'images') {
    document.getElementById('images-tab').classList.add('active-tab');
    document.getElementById('music-content').classList.remove('active');
    document.getElementById('images-content').classList.add('active');
    currentTab = 'images';
  }
}

document.getElementById('music-tab').addEventListener('click', () => {
  switchTab('music');
});

document.getElementById('images-tab').addEventListener('click', () => {
  switchTab('images');
});

/* ==========================
   INJECT CSS
========================== */
const style = document.createElement("style");
style.innerHTML = `
.active-tab { background: chartreuse; color: black; border-color: chartreuse; }
.active-nav i { color: chartreuse; }

.songs-scroll {
  position: fixed;
  top:95px;
  bottom:140px;
  left:0;
  right:0;
  overflow-y:auto;
  padding:20px;
}

.songs {
  display:flex;
  flex-direction:column;
  gap:40px;
}

.song-row {
  display:flex;
  gap:25px;
  overflow-x:auto;
  scroll-behavior:smooth;
  padding-bottom:10px;
}

.song-row::-webkit-scrollbar {
  height:8px;
}
.song-row::-webkit-scrollbar-thumb {
  background:chartreuse;
  border-radius:10px;
}

.song-card {
  background: linear-gradient(yellow, #3abe10, yellow, red, yellow);
  border-radius:18px;
  height:30vh;
  min-width:280px;
  overflow:hidden;
  position:relative;
  cursor:pointer;
  aspect-ratio:16 / 9;
  flex-shrink:0;
}

.song-card img {
  width:100%;
  height:100%;
  object-fit:contain;
}

.song-title {
  position:absolute;
  bottom:8px;
  left:8px;
  right:8px;
  font-family:sans-serif;
  color:black;
  font-size:30px;
  font-weight:900;
  height:40px;
  text-align:center;
  overflow:hidden;
  text-overflow:ellipsis;
  white-space:nowrap;
  z-index:2;
  background:white;
  padding:6px;
  border-radius:10px;
}

.play-overlay {
  position:absolute;
  inset:0;
  display:flex;
  align-items:center;
  justify-content:center;
  font-size:40px;
  background:rgba(0,0,0,.4);
  color:white;
  opacity:0;
  transition:.25s;
}
.song-card:hover .play-overlay { opacity:1; }

.loader-wrap {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:12px;
  z-index:1000;
}

.loader {
  width: 80px;
  height: 80px;
  border: 8px solid rgba(255,255,255,0.3);
  border-top: 8px solid chartreuse;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loader-text {
  color: white;
  font-size: 25px;
  font-weight: 600;
  text-align: center;
  max-width: 300px;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Content containers */
.content-container {
  display: none;
  position: fixed;
  top: 95px;
  bottom: 140px;
  left: 0;
  right: 0;
  overflow-y: auto;
  padding: 20px;
}

.content-container.active {
  display: block;
}

.images-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  padding: 20px;
}

.image-card {
  background: white;
  border-radius: 15px;
  overflow: hidden;
  cursor: pointer;
  transition: transform 0.3s ease;
}

.image-card:hover {
  transform: scale(1.05);
}

.image-card img {
  width: 100%;
  height: 200px;
  object-fit: cover;
}

.image-title {
  padding: 10px;
  color: black;
  text-align: center;
  font-weight: bold;
}

.error-message {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(0,0,0,0.9);
  color: white;
  padding: 30px;
  border-radius: 15px;
  text-align: center;
  z-index: 1001;
  max-width: 400px;
  border: 2px solid chartreuse;
  display: none;
}

.retry-btn {
  background: chartreuse;
  color: black;
  border: none;
  padding: 12px 24px;
  margin-top: 20px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
  font-size: 16px;
}

.retry-btn:hover {
  background: #9dff00;
}

.info-message {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0,0,0,0.8);
  color: chartreuse;
  padding: 10px 20px;
  border-radius: 20px;
  font-size: 14px;
  z-index: 100;
  display: none;
}
`;
document.head.appendChild(style);

/* ==========================
   CREATE UI ELEMENTS
========================== */
// Create music content container
const musicContent = document.createElement("div");
musicContent.className = "content-container active";
musicContent.id = "music-content";
document.body.appendChild(musicContent);

// Create images content container
const imagesContent = document.createElement("div");
imagesContent.className = "content-container";
imagesContent.id = "images-content";
document.body.appendChild(imagesContent);

// Add images grid
const imagesGrid = document.createElement("div");
imagesGrid.className = "images-container";
imagesContent.appendChild(imagesGrid);

/* ==========================
   GRID FOR MUSIC
========================== */
const scroll = document.createElement("div");
scroll.className = "songs-scroll";
musicContent.appendChild(scroll);

const grid = document.createElement("div");
grid.className = "songs";
scroll.appendChild(grid);

/* ==========================
   LOADER
========================== */
const loaderWrap = document.createElement("div");
loaderWrap.className = "loader-wrap";

const loader = document.createElement("div");
loader.className = "loader";

const loaderText = document.createElement("div");
loaderText.className = "loader-text";
loaderText.textContent = "Loading songs. If songs do not appear after sometimes or max within 1-2 minute please refresh the app...";

loaderWrap.append(loader, loaderText);
document.body.appendChild(loaderWrap);

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

function showInfo(message, duration = 3000) {
  const infoDiv = document.createElement("div");
  infoDiv.className = "info-message";
  infoDiv.textContent = message;
  infoDiv.style.display = 'block';
  document.body.appendChild(infoDiv);
  
  setTimeout(() => {
    if (infoDiv.parentNode) {
      infoDiv.remove();
    }
  }, duration);
}

function showError(message) {
  const errorDiv = document.createElement("div");
  errorDiv.className = "error-message";
  errorDiv.innerHTML = `
    <h3>Error</h3>
    <p>${message}</p>
    <p style="font-size: 12px; margin-top: 10px; color: #ccc;">
      Backend: ${BACKEND_URL}
    </p>
    <button class="retry-btn">Retry Loading</button>
  `;
  errorDiv.style.display = 'block';
  document.body.appendChild(errorDiv);
  
  errorDiv.querySelector('.retry-btn').addEventListener('click', () => {
    errorDiv.remove();
    // Reset and start fresh
    currentPage = 1;
    hasMoreSongs = true;
    grid.innerHTML = '';
    loaderWrap.style.display = 'flex';
    fetchSongsBatch(1);
  });
}

/* ==========================
   GET PROXIED URLS
========================== */
function getProxiedAudioUrl(githubUrl) {
  if (!githubUrl) return '';
  
  // If backend already provides audioProxy, use it
  if (typeof githubUrl === 'object' && githubUrl.audioProxy) {
    return githubUrl.audioProxy;
  }
  
  // Otherwise construct proxied URL
  const encodedUrl = encodeURIComponent(githubUrl);
  return `${BACKEND_BASE_URL}/audio?url=${encodedUrl}`;
}

function getProxiedThumbnailUrl(githubUrl) {
  if (!githubUrl) return 'https://via.placeholder.com/400x225/333/fff?text=No+Image';
  
  // If backend already provides thumbnailProxy, use it
  if (typeof githubUrl === 'object' && githubUrl.thumbnailProxy) {
    return githubUrl.thumbnailProxy;
  }
  
  // Otherwise construct proxied URL
  const encodedUrl = encodeURIComponent(githubUrl);
  return `${BACKEND_BASE_URL}/thumbnail?url=${encodedUrl}`;
}

/* ==========================
   VARIABLES FOR BATCH FETCHING
========================== */
let currentPage = 1;
let isLoading = false;
let hasMoreSongs = true;
let totalSongs = 0;

/* ==========================
   FETCH 5 SONGS AT A TIME
========================== */
async function fetchSongsBatch(page) {
  if (isLoading) {
    console.log("Already loading, skipping...");
    return;
  }
  
  if (!hasMoreSongs && page > 1) {
    console.log("No more songs to fetch");
    return;
  }
  
  isLoading = true;
  
  try {
    // Show loader for first page
    if (page === 1) {
      loaderWrap.style.display = 'flex';
    } else {
      showInfo(`Loading page ${page}...`);
    }
    
    console.log(`=== FETCHING BATCH ${page} ===`);
    
    // Add cache-busting parameter to avoid stale data
    const url = `${BACKEND_URL}?page=${page}&limit=5&_t=${Date.now()}`;
    console.log(`Request URL: ${url}`);
    
    const startTime = Date.now();
    const res = await fetch(url, {
      headers: {
        'Cache-Control': 'no-cache'
      }
    });
    const fetchTime = Date.now() - startTime;
    
    console.log(`Fetch completed in ${fetchTime}ms, Status: ${res.status}`);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error("Response error:", errorText);
      throw new Error(`Server returned ${res.status}: ${res.statusText}`);
    }
    
    const data = await res.json();
    console.log(`Response data received`);
    
    // Check if data structure is correct
    if (!data || typeof data !== 'object') {
      throw new Error("Invalid response format from server");
    }
    
    // Update total songs count
    if (data.total) {
      totalSongs = data.total;
    }
    
    // Get songs array
    const songs = data.songs || [];
    
    // Check if we got songs
    if (!songs || songs.length === 0) {
      if (page === 1) {
        loaderText.textContent = "No songs found in your repositories";
        setTimeout(() => {
          showError("No songs found. Make sure your GitHub repos have title.txt, .mp3, and image files.");
        }, 2000);
      }
      hasMoreSongs = false;
      return;
    }
    
    // Hide loader after first successful batch
    if (page === 1) {
      loaderWrap.style.display = 'none';
      if (totalSongs > 0) {
        showInfo(`Found ${totalSongs} total songs. Loading in batches...`, 3000);
      }
    }
    
    // Create a new row for this batch (5 songs)
    const row = document.createElement("div");
    row.className = "song-row";
    grid.appendChild(row);
    
    // Display each song in the batch
    songs.forEach((song, index) => {
      if (!song.name && song.audio) {
        song.name = extractTitleFromAudio(song.audio);
      }
      createCard(song, row);
      console.log(`Added song ${index + 1}: ${song.name || 'Unknown'}`);
    });
    
    // Update hasMore flag
    if (data.hasMore !== undefined) {
      hasMoreSongs = data.hasMore;
    } else {
      // If no hasMore flag, assume more if we got 5 songs
      hasMoreSongs = songs.length === 5;
    }
    
    // If there are more songs, fetch next batch after 1 second
    if (hasMoreSongs) {
      console.log(`Waiting 1 second before fetching page ${page + 1}...`);
      
      setTimeout(() => {
        currentPage++;
        console.log(`=== AUTO-FETCHING BATCH ${currentPage} ===`);
        fetchSongsBatch(currentPage);
      }, 1000);
      
    } else {
      console.log("=== ALL SONGS LOADED ===");
      console.log(`Total pages: ${page}`);
      console.log(`Total songs: ${totalSongs || 'unknown'}`);
      
      if (totalSongs > 0) {
        showInfo(`All songs loaded!`, 2000);
      }
    }
    
  } catch (error) {
    console.error("=== FETCH ERROR ===", error);
    
    if (page === 1) {
      loaderText.textContent = "Connection failed";
      showError(`Failed to connect to backend: ${error.message}
      
Possible issues:
1. Backend server is not running
2. Network connection problem
3. CORS issue
4. API rate limit

Check console for details.`);
    } else {
      showError(`Failed to load page ${page}: ${error.message}`);
    }
    
    hasMoreSongs = false;
    
  } finally {
    isLoading = false;
    console.log(`=== BATCH ${page} COMPLETED ===\n`);
  }
}

/* ==========================
   CREATE CARD WITH PROXIED URLS
========================== */
function createCard(song, parent) {
  const card = document.createElement("div");
  card.className = "song-card";

  // Get proxied URLs
  const audioUrl = getProxiedAudioUrl(song.audio || song.audioProxy || song.audio);
  const thumbnailUrl = getProxiedThumbnailUrl(song.thumbnail || song.thumbnailProxy || song.thumbnail);

  const img = document.createElement("img");
  img.src = thumbnailUrl;
  img.alt = song.name || "Song cover";
  img.onerror = function() {
    this.src = 'https://via.placeholder.com/400x225/333/fff?text=No+Image';
  };

  const overlay = document.createElement("div");
  overlay.className = "play-overlay";
  overlay.innerHTML = `<i class="fa-solid fa-play"></i>`;

  const title = document.createElement("div");
  title.className = "song-title";
  title.textContent = song.name || "Unknown Title";

  card.append(img, overlay, title);
  parent.appendChild(card);

  // Song click handler
  card.onclick = () => {
    // Close any existing player window
    if (window.playerWindow && !window.playerWindow.closed) {
      window.playerWindow.close();
    }
    
    // Create URL parameters
    const params = new URLSearchParams();
    params.append('name', encodeURIComponent(title.textContent));
    
    // Use proxied audio URL if available, otherwise use original
    if (audioUrl) {
      params.append('audio', encodeURIComponent(audioUrl));
    } else if (song.audio) {
      params.append('audio', encodeURIComponent(song.audio));
    }
    
    // Use proxied thumbnail URL if available, otherwise use original
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
    
    // Log the URL for debugging
    console.log("Opening player with URL:", `view.html?${params.toString()}`);
    
    // Open player
    window.playerWindow = window.open(`view.html?${params.toString()}`, "_blank");
    
    // Force the new window to focus
    if (window.playerWindow) {
      window.playerWindow.focus();
    }
  };
}

/* ==========================
   INFINITE SCROLL (backup)
========================== */
let isScrolling = false;
scroll.addEventListener('scroll', () => {
  if (isLoading || !hasMoreSongs) return;
  
  const scrollPosition = scroll.scrollTop + scroll.clientHeight;
  const scrollHeight = scroll.scrollHeight;
  
  // Load more when 90% scrolled
  if (scrollPosition >= scrollHeight * 0.9) {
    if (!isScrolling) {
      isScrolling = true;
      console.log("Scroll detected, loading more...");
      currentPage++;
      fetchSongsBatch(currentPage);
      
      setTimeout(() => {
        isScrolling = false;
      }, 2000);
    }
  }
});

/* ==========================
   INITIALIZE
========================== */
console.log("=== MUSIC APP INITIALIZED ===");
console.log(`Backend URL: ${BACKEND_URL}`);
console.log(`Backend Base URL: ${BACKEND_BASE_URL}`);
console.log("Starting batch fetching...");

// Start fetching first batch
fetchSongsBatch(1);

// Add manual refresh button
const refreshBtn = document.createElement("button");
refreshBtn.textContent = "🔄 Refresh";
refreshBtn.style.cssText = `
  position: fixed;
  bottom: 60px;
  display: none;
  right: 20px;
  background: chartreuse;
  color: black;
  border: none;
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  z-index: 1000;
  opacity: 0.7;
`;
refreshBtn.addEventListener('click', () => {
  console.log("Manual refresh triggered");
  currentPage = 1;
  hasMoreSongs = true;
  grid.innerHTML = '';
  loaderWrap.style.display = 'flex';
  fetchSongsBatch(1);
});
document.body.appendChild(refreshBtn);

// Make functions available globally for debugging
window.fetchSongsBatch = fetchSongsBatch;
window.getProxiedAudioUrl = getProxiedAudioUrl;
window.getProxiedThumbnailUrl = getProxiedThumbnailUrl;

// Add test button for debugging
const testBtn = document.createElement("button");
testBtn.textContent = "🔧 Test";
testBtn.style.cssText = `
  position: fixed;
  bottom: 100px;
  right: 20px;
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 15px;
  border-radius: 20px;
  font-weight: bold;
  cursor: pointer;
  z-index: 1000;
  opacity: 0.7;
  display: none;
`;
testBtn.addEventListener('click', () => {
  console.log("=== DEBUG INFO ===");
  console.log("Backend URLs:", {
    songs: BACKEND_URL,
    base: BACKEND_BASE_URL,
    audio: `${BACKEND_BASE_URL}/audio?url=TEST`,
    thumbnail: `${BACKEND_BASE_URL}/thumbnail?url=TEST`
  });
  
  // Test proxied URL generation
  const testUrl = "https://raw.githubusercontent.com/user/repo/main/song.mp3";
  console.log("Proxied audio URL example:", getProxiedAudioUrl(testUrl));
});
document.body.appendChild(testBtn);