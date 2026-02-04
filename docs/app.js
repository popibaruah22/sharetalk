/* ==========================
   CONFIG
========================== */
const BACKEND_URL = "https://musten-backend.onrender.com/songs";

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
    currentTab = 'music';
  } else if (tabName === 'images') {
    document.getElementById('images-tab').classList.add('active-tab');
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
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
display: none;
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
loaderText.textContent = "Loading songs...";

loaderWrap.append(loader, loaderText);
musicContent.appendChild(loaderWrap);

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
  document.body.appendChild(errorDiv);
  
  errorDiv.querySelector('.retry-btn').addEventListener('click', () => {
    errorDiv.remove();
    // Reset and start fresh
    currentPage = 1;
    hasMoreSongs = true;
    grid.innerHTML = '';
    fetchSongsBatch(1);
  });
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
      loaderText.textContent = `Loading songs. If songs do not appear after sometimes or max within 1 minute please refresh the app...`;
    } else {
      showInfo(`Loading page ${page}...`);
    }
    
    console.log(`=== FETCHING BATCH ${page} ===`);
    console.log(`Request URL: ${BACKEND_URL}?page=${page}&limit=5`);
    
    // Add cache-busting parameter to avoid stale data
    const url = `${BACKEND_URL}?page=${page}&limit=5&_t=${Date.now()}`;
    
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
    console.log(`Response data:`, {
      songsCount: data.songs?.length || 0,
      page: data.page,
      total: data.total,
      hasMore: data.hasMore,
      cacheHit: data.cacheHit || false
    });
    
    // Update total songs count
    if (data.total) {
      totalSongs = data.total;
    }
    
    // Check if we got songs
    if (!data.songs || data.songs.length === 0) {
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
      showInfo(`Found ${totalSongs} total songs. Loading in batches...`);
    }
    
    // Create a new row for this batch (5 songs)
    const row = document.createElement("div");
    row.className = "song-row";
    grid.appendChild(row);
    
    // Display each song in the batch
    data.songs.forEach((song, index) => {
      if (!song.name && song.audio) {
        song.name = extractTitleFromAudio(song.audio);
      }
      createCard(song, row);
      console.log(`Added song ${index + 1}: ${song.name}`);
    });
    
    // Update hasMore flag
    hasMoreSongs = data.hasMore;
    
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
      console.log(`Total songs: ${totalSongs}`);
      
      if (totalSongs > 0) {
        showInfo(`All ${totalSongs} songs loaded!`, 2000);
      }
    }
    
  } catch (error) {
    console.error("=== FETCH ERROR ===", error);
    
    if (page === 1) {
      loaderText.textContent = "Connection failed";
      setTimeout(() => {
        showError(`Failed to connect to backend: ${error.message}
        
Possible issues:
1. Backend server is glitching
2. Network connection problem
3.  API rate limit issues

Check console for details.`);
      }, 1000);
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
   CREATE CARD
========================== */
function createCard(song, parent) {
  const card = document.createElement("div");
  card.className = "song-card";

  const img = document.createElement("img");
  img.src = song.thumbnail;
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

  card.onclick = () => {
    const params = new URLSearchParams();
    params.append('name', encodeURIComponent(title.textContent));
    params.append('audio', encodeURIComponent(song.audio));
    params.append('thumbnail', encodeURIComponent(song.thumbnail));
    
    window.open(`view.html?${params.toString()}`, "_blank");
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
console.log("Starting batch fetching...");

// Start fetching first batch
fetchSongsBatch(1);

// Add manual refresh button for testing
const refreshBtn = document.createElement("button");
refreshBtn.textContent = "🔄 Refresh";
refreshBtn.style.cssText = `
  position: fixed;
  bottom: 60px;
  right: 20px;
  background: chartreuse;
  color: black;
  border: none;
display: none;
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
  fetchSongsBatch(1);
});
document.body.appendChild(refreshBtn);