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

// Function to switch tabs
function switchTab(tabName) {
  // Remove active class from all tabs
  document.querySelectorAll('.app-tab').forEach(tab => {
    tab.classList.remove('active-tab');
  });
  
  // Add active class to clicked tab
  if (tabName === 'music') {
    document.getElementById('music-tab').classList.add('active-tab');
    currentTab = 'music';
    // Show music content if needed
    if (typeof showMusicContent === 'function') {
      showMusicContent();
    }
  } else if (tabName === 'images') {
    document.getElementById('images-tab').classList.add('active-tab');
    currentTab = 'images';
    // Show images content if needed
    if (typeof showImagesContent === 'function') {
      showImagesContent();
    }
  }
}

// Add click event listeners to tabs
document.getElementById('music-tab').addEventListener('click', () => {
  switchTab('music');
});

document.getElementById('images-tab').addEventListener('click', () => {
  switchTab('images');
});

// Add click event to document to handle clicking outside
document.addEventListener('click', (e) => {
  // Check if click is outside both tab buttons
  const musicTab = document.getElementById('music-tab');
  const imagesTab = document.getElementById('images-tab');
  
  if (!musicTab.contains(e.target) && !imagesTab.contains(e.target)) {
    // Click was outside the tab buttons - keep current tab active
    // No action needed as active tab should remain active
  }
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
`;
document.head.appendChild(style);

/* ==========================
   CONTENT CONTAINERS
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

// Add images grid to images content
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
loaderText.textContent = "Loading songs... If songs do not appear within 1 minute or for a long time try the app after restarting after sometimes or later...";

loaderWrap.append(loader, loaderText);
musicContent.appendChild(loaderWrap);

/* ==========================
   CONTENT MANAGEMENT FUNCTIONS
========================== */
function showMusicContent() {
  document.getElementById('music-content').classList.add('active');
  document.getElementById('images-content').classList.remove('active');
}

function showImagesContent() {
  document.getElementById('music-content').classList.remove('active');
  document.getElementById('images-content').classList.add('active');
  loadImagesContent();
}

function loadImagesContent() {
  // Clear previous images
  imagesGrid.innerHTML = '';
  
  // Add placeholder images or fetch from API
  const placeholderImages = [];
  
  placeholderImages.forEach(image => {
    const card = document.createElement("div");
    card.className = "image-card";
    
    const img = document.createElement("img");
    img.src = image.url;
    img.alt = image.title;
    
    const title = document.createElement("div");
    title.className = "image-title";
    title.textContent = image.title;
    
    card.append(img, title);
    imagesGrid.appendChild(card);
    
    card.onclick = () => {
      alert(`Clicked: ${image.title}`);
      // You can implement full-screen image view here
    };
  });
}

/* ==========================
   HELPER
========================== */
function extractTitleFromAudio(audioPath) {
  if (!audioPath) return "Unknown Title";
  const cleanPath = audioPath.split("?")[0];
  const fileName = cleanPath.split("/").pop();
  
  // Try to decode the filename, but fallback if it fails
  try {
    const decoded = decodeURIComponent(fileName);
    return decoded.replace(/\.[^/.]+$/, "");
  } catch (e) {
    // If decoding fails, try to clean up the filename
    const cleanName = fileName.replace(/\.[^/.]+$/, "");
    // Remove URL-encoded characters manually
    return cleanName.replace(/%20/g, ' ').replace(/%2C/g, ',').replace(/%27/g, "'");
  }
}

/* ==========================
   FETCH SONGS
========================== */
async function fetchSongs() {
  try {
    const res = await fetch(BACKEND_URL);
    if (!res.ok) throw new Error("Fetch failed");
    const allSongs = await res.json();

    // Sort newest first
    allSongs.sort((a, b) => {
      if (a._id && b._id) return b._id.localeCompare(a._id);
      return 0;
    });

    const batchSize = 5; // 5 songs per batch (row)

    for (let i = 0; i < allSongs.length; i += batchSize) {
      const row = document.createElement("div");
      row.className = "song-row";
      grid.appendChild(row);

      const batch = allSongs.slice(i, i + batchSize);
      batch.forEach(song => {
        if (!song.name && song.audio) {
          song.name = extractTitleFromAudio(song.audio);
        }
        createCard(song, row);
      });

      // ✅ Remove loader after first batch
      if (i === 0) loaderWrap.remove();

      // Wait 1 second before next batch (silent fetch)
      await new Promise(r => setTimeout(r, 1000));
    }

  } catch (e) {
    console.error(e);
    loaderText.textContent = "Failed to load songs";
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

  const overlay = document.createElement("div");
  overlay.className = "play-overlay";
  overlay.innerHTML = `<i class="fa-solid fa-play"></i>`;

  const title = document.createElement("div");
  title.className = "song-title";
  title.textContent = song.name || "Unknown Title";

  card.append(img, overlay, title);
  parent.appendChild(card);

  card.onclick = () => {
    // FIX: Properly encode all URL parameters to handle special characters in audio URLs
    const params = new URLSearchParams();
    params.append('name', encodeURIComponent(title.textContent));
    params.append('audio', encodeURIComponent(song.audio));
    params.append('thumbnail', encodeURIComponent(song.thumbnail));
    
    window.open(`view.html?${params.toString()}`, "_blank");
  };
}

/* ==========================
   INIT
========================== */
fetchSongs();
