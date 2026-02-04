/* ==========================
   VIEW.JS - AUDIO PLAYER WITH BACKEND PROXY
========================== */

const BACKEND_BASE = "https://musten-backend.onrender.com";

// ==========================
// GLOBAL STATE
// ==========================
let audio = null;
let isPlaying = false;
let currentVolume = 0.7;
let hasUserInteracted = false;
let currentSong = null;

// ==========================
// ELEMENTS
// ==========================
let playBtn, playIcon, seekbar, currentTimeEl, totalTimeEl;
let prevBtn, nextBtn, volumeSlider, songThumbnail, currentSongTitle;
let artistName, vinylRecord;

// ==========================
// MAIN INITIALIZATION
// ==========================
document.addEventListener('DOMContentLoaded', function() {
    console.log("🎵 Player Initializing...");
    
    // Get elements
    getElements();
    
    // Get song data from URL
    const params = new URLSearchParams(window.location.search);
    const songName = params.get('name') || "Unknown Song";
    const audioUrl = params.get('audio');
    const thumbnailUrl = params.get('thumbnail');
    
    console.log("📊 URL Parameters:", { 
        name: songName, 
        audio: audioUrl ? "Present" : "Missing", 
        thumbnail: thumbnailUrl ? "Present" : "Missing" 
    });
    
    // Initialize with current song
    initializeCurrentSong(songName, audioUrl, thumbnailUrl);
    
    // Setup all listeners
    setupAllEventListeners();
    
    console.log("✅ Player Ready");
});

// ==========================
// GET ELEMENTS
// ==========================
function getElements() {
    currentSongTitle = document.getElementById('currentSongTitle');
    songThumbnail = document.getElementById('songThumbnail');
    playBtn = document.getElementById('playBtn');
    playIcon = playBtn ? playBtn.querySelector('i') : null;
    seekbar = document.getElementById('seekbar');
    currentTimeEl = document.getElementById('currentTime');
    totalTimeEl = document.getElementById('totalTime');
    prevBtn = document.getElementById('prevBtn');
    nextBtn = document.getElementById('nextBtn');
    volumeSlider = document.getElementById('volumeSlider');
    artistName = document.getElementById('artistName');
    vinylRecord = document.querySelector('.vinyl-record');
    
    console.log("🔍 Elements found:", {
        title: !!currentSongTitle,
        thumbnail: !!songThumbnail,
        playBtn: !!playBtn,
        playIcon: !!playIcon,
        seekbar: !!seekbar,
        currentTime: !!currentTimeEl,
        totalTime: !!totalTimeEl,
        prevBtn: !!prevBtn,
        nextBtn: !!nextBtn,
        volume: !!volumeSlider,
        artist: !!artistName,
        vinyl: !!vinylRecord
    });
}

// ==========================
// INITIALIZE CURRENT SONG
// ==========================
function initializeCurrentSong(name, audioUrl, thumbnailUrl) {
    console.log("🚀 Initializing song:", name);
    
    try {
        currentSong = {
            name: decodeURIComponent(name),
            audio: audioUrl ? decodeURIComponent(audioUrl) : "",
            thumbnail: thumbnailUrl ? decodeURIComponent(thumbnailUrl) : ""
        };
        
        console.log("🎵 Song data:", currentSong);
        
        // Update UI
        updateSongUI();
        
        // Initialize audio
        initializeAudio();
        
    } catch (error) {
        console.error("❌ Initialization failed:", error);
        showError(`Failed to load song: ${error.message}`);
    }
}

// ==========================
// UPDATE SONG UI
// ==========================
function updateSongUI() {
    // Update title
    if (currentSongTitle) {
        currentSongTitle.textContent = currentSong.name || "Unknown Song";
    }
    
    // Update artist name if element exists
    if (artistName) {
        const artist = extractArtistName(currentSong.name);
        artistName.textContent = artist || "Unknown Artist";
    }
    
    // Update thumbnail
    if (songThumbnail) {
        if (currentSong.thumbnail && currentSong.thumbnail.trim()) {
            // Use proxied thumbnail URL
            const proxiedThumbnail = getProxiedThumbnailUrl(currentSong.thumbnail);
            songThumbnail.src = proxiedThumbnail;
            songThumbnail.style.display = 'block';
            songThumbnail.onerror = () => {
                console.log("⚠️ Thumbnail failed, showing vinyl");
                showVinylRecord();
            };
        } else {
            showVinylRecord();
        }
    }
    
    // Reset progress
    if (seekbar) {
        seekbar.value = 0;
        seekbar.disabled = false;
    }
    if (currentTimeEl) {
        currentTimeEl.textContent = "0:00";
    }
    if (totalTimeEl) {
        totalTimeEl.textContent = "0:00";
    }
    
    // Reset play button
    if (playIcon) {
        playIcon.className = "fas fa-play";
    }
    if (playBtn) {
        playBtn.disabled = false;
        playBtn.title = "Play";
    }
}

function showVinylRecord() {
    if (songThumbnail) {
        songThumbnail.style.display = 'none';
    }
    if (vinylRecord) {
        vinylRecord.style.display = 'flex';
    }
}

function extractArtistName(title) {
    if (!title) return "";
    
    try {
        // Common patterns: "Artist - Song", "Song by Artist"
        if (title.includes(' - ')) {
            return title.split(' - ')[0].trim();
        } else if (title.includes(' by ')) {
            return title.split(' by ')[1].trim();
        } else if (title.includes('(')) {
            return title.split('(')[0].trim();
        }
        
        return "";
    } catch (e) {
        return "";
    }
}

// ==========================
// GET PROXIED URLS
// ==========================
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
    if (!githubUrl) return '';
    
    // If URL is already a proxy URL, use it as is
    if (githubUrl.includes('/thumbnail?url=')) {
        return githubUrl;
    }
    
    // Convert GitHub URL to backend proxy URL
    const encodedUrl = encodeURIComponent(githubUrl);
    return `${BACKEND_BASE}/thumbnail?url=${encodedUrl}`;
}

// ==========================
// AUDIO INITIALIZATION
// ==========================
function initializeAudio() {
    // Clean up previous audio
    if (audio) {
        audio.pause();
        audio.src = "";
        audio = null;
    }
    
    // Check if we have audio URL
    if (!currentSong.audio) {
        console.error("❌ No audio URL provided");
        showError("No audio URL provided for this song");
        return;
    }
    
    console.log("🔗 Original audio URL:", currentSong.audio);
    
    // Get proxied audio URL
    const proxiedAudioUrl = getProxiedAudioUrl(currentSong.audio);
    console.log("🔗 Proxied audio URL:", proxiedAudioUrl);
    
    // Create audio element
    audio = new Audio();
    
    // Configure audio
    audio.preload = "auto";
    audio.volume = currentVolume;
    audio.crossOrigin = "anonymous"; // Important for CORS
    
    // Set audio source
    audio.src = proxiedAudioUrl;
    
    // Set volume slider
    if (volumeSlider) {
        volumeSlider.value = currentVolume;
    }
    
    // Setup audio event listeners
    setupAudioEventListeners();
    
    // Show loading state
    if (playIcon) {
        playIcon.className = "fas fa-spinner fa-spin";
    }
    if (playBtn) {
        playBtn.disabled = true;
        playBtn.title = "Loading audio...";
    }
    
    // Start loading
    audio.load();
    
    // Set timeout for loading
    setTimeout(() => {
        if (playBtn && playBtn.disabled) {
            console.log("⏱️ Audio loading timeout");
            playBtn.disabled = false;
            playBtn.title = "Click to play";
            if (playIcon && playIcon.className === "fas fa-spinner fa-spin") {
                playIcon.className = "fas fa-play";
            }
        }
    }, 10000); // 10 second timeout
}

// ==========================
// AUDIO EVENT LISTENERS
// ==========================
function setupAudioEventListeners() {
    if (!audio) return;
    
    // Clear old listeners
    audio.oncanplay = null;
    audio.onplaying = null;
    audio.onpause = null;
    audio.onended = null;
    audio.ontimeupdate = null;
    audio.onerror = null;
    audio.onloadedmetadata = null;
    audio.onwaiting = null;
    
    // Can play - audio is ready
    audio.oncanplay = function() {
        console.log("✅ Audio ready to play");
        
        // Enable play button
        if (playBtn) {
            playBtn.disabled = false;
            playBtn.title = "Play";
        }
        if (playIcon) {
            playIcon.className = "fas fa-play";
        }
        
        // Update duration if available
        if (totalTimeEl && audio.duration) {
            totalTimeEl.textContent = formatTime(audio.duration);
        }
        
        // Auto-play if user has already interacted
        if (hasUserInteracted && !isPlaying) {
            console.log("🎵 Auto-playing after user interaction");
            setTimeout(() => playAudio(), 100);
        }
    };
    
    // Playing started
    audio.onplaying = function() {
        console.log("▶️ Now playing");
        isPlaying = true;
        updatePlayButton();
        if (vinylRecord) {
            vinylRecord.style.animationPlayState = 'running';
        }
    };
    
    // Paused
    audio.onpause = function() {
        console.log("⏸️ Paused");
        isPlaying = false;
        updatePlayButton();
        if (vinylRecord) {
            vinylRecord.style.animationPlayState = 'paused';
        }
    };
    
    // Ended
    audio.onended = function() {
        console.log("🏁 Playback ended");
        isPlaying = false;
        audio.currentTime = 0;
        updatePlayButton();
        updateProgress();
        if (vinylRecord) {
            vinylRecord.style.animationPlayState = 'paused';
        }
    };
    
    // Time update
    audio.ontimeupdate = function() {
        updateProgress();
    };
    
    // Metadata loaded
    audio.onloadedmetadata = function() {
        console.log("📊 Duration loaded:", formatTime(audio.duration));
        if (totalTimeEl) {
            totalTimeEl.textContent = formatTime(audio.duration);
        }
        if (seekbar) {
            seekbar.max = 100;
            seekbar.disabled = false;
        }
    };
    
    // Error handling
    audio.onerror = function() {
        console.error("❌ Audio error:", audio.error);
        
        if (playBtn) {
            playBtn.disabled = false;
            playBtn.title = "Error - Click to retry";
        }
        if (playIcon) {
            playIcon.className = "fas fa-exclamation-triangle";
        }
        
        let errorMsg = "Audio error: ";
        if (audio.error) {
            switch(audio.error.code) {
                case 1:
                    errorMsg += "Aborted by user";
                    break;
                case 2:
                    errorMsg += "Network error";
                    break;
                case 3:
                    errorMsg += "Decoding error (file may be corrupted)";
                    break;
                case 4:
                    errorMsg += "Format not supported (MP3 only)";
                    break;
                default:
                    errorMsg += "Unknown error";
            }
        }
        
        console.error("❌ Detailed error:", errorMsg);
        
        // Show error after a delay
        setTimeout(() => {
            showError(errorMsg);
        }, 1000);
    };
    
    // Waiting (buffering)
    audio.onwaiting = function() {
        console.log("⏳ Buffering...");
        if (playIcon && isPlaying) {
            playIcon.className = "fas fa-spinner fa-spin";
        }
    };
    
    // Can play through
    audio.oncanplaythrough = function() {
        console.log("🎯 Can play through without stopping");
        if (playIcon && playIcon.className === "fas fa-spinner fa-spin") {
            playIcon.className = isPlaying ? "fas fa-pause" : "fas fa-play";
        }
    };
}

// ==========================
// PLAYBACK CONTROLS
// ==========================
function playAudio() {
    if (!audio) {
        console.log("❌ No audio element");
        return;
    }
    
    console.log("▶️ Attempting to play...");
    
    const playPromise = audio.play();
    
    if (playPromise !== undefined) {
        playPromise
            .then(() => {
                console.log("✅ Play successful");
            })
            .catch(error => {
                console.log("❌ Play failed:", error.name);
                
                // Update button state
                isPlaying = false;
                updatePlayButton();
                
                // Show visual feedback for autoplay block
                if (playBtn && error.name === 'NotAllowedError') {
                    console.log("👆 Autoplay blocked, waiting for user gesture");
                    playBtn.style.animation = "pulse 1s infinite";
                    playBtn.title = "Click to play (autoplay blocked)";
                    
                    setTimeout(() => {
                        playBtn.style.animation = "";
                    }, 3000);
                }
            });
    }
}

function togglePlayPause() {
    if (!audio) {
        console.log("❌ No audio element");
        return;
    }
    
    // Mark user interaction
    hasUserInteracted = true;
    
    if (isPlaying) {
        console.log("⏸️ Pausing...");
        audio.pause();
    } else {
        console.log("▶️ Playing...");
        playAudio();
    }
}

function skipBackward() {
    if (!audio) return;
    
    hasUserInteracted = true;
    audio.currentTime = Math.max(0, audio.currentTime - 10);
    updateProgress();
}

function skipForward() {
    if (!audio) return;
    
    hasUserInteracted = true;
    if (audio.duration) {
        audio.currentTime = Math.min(audio.duration, audio.currentTime + 30);
    } else {
        audio.currentTime += 30;
    }
    updateProgress();
}

function seekToPosition(value) {
    if (!audio || !audio.duration) return;
    
    hasUserInteracted = true;
    const time = (value / 100) * audio.duration;
    audio.currentTime = time;
    updateProgress();
}

function changeVolume(value) {
    currentVolume = parseFloat(value);
    if (audio) {
        audio.volume = currentVolume;
    }
}

function toggleMute() {
    if (!audio) return;
    
    if (audio.volume > 0) {
        audio.volume = 0;
        if (volumeSlider) {
            volumeSlider.value = 0;
        }
        console.log("🔇 Muted");
    } else {
        audio.volume = currentVolume;
        if (volumeSlider) {
            volumeSlider.value = currentVolume;
        }
        console.log("🔊 Unmuted");
    }
}

// ==========================
// UI UPDATES
// ==========================
function updatePlayButton() {
    if (!playBtn || !playIcon) return;
    
    playBtn.disabled = false;
    playBtn.title = isPlaying ? "Pause" : "Play";
    
    if (isPlaying) {
        playIcon.className = "fas fa-pause";
    } else {
        playIcon.className = "fas fa-play";
    }
    
    // Remove pulse animation
    if (playBtn.style.animation) {
        playBtn.style.animation = "";
        playBtn.title = isPlaying ? "Pause" : "Play";
    }
}

function updateProgress() {
    if (!audio || !audio.duration || !seekbar || !currentTimeEl) return;
    
    const currentTime = audio.currentTime;
    const duration = audio.duration;
    const progress = (currentTime / duration) * 100;
    
    seekbar.value = progress;
    currentTimeEl.textContent = formatTime(currentTime);
    
    if (totalTimeEl && !totalTimeEl.textContent.includes(':')) {
        totalTimeEl.textContent = formatTime(duration);
    }
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ==========================
// EVENT LISTENERS SETUP
// ==========================
function setupAllEventListeners() {
    console.log("🔗 Setting up listeners...");
    
    // Play/Pause button
    if (playBtn) {
        playBtn.addEventListener('click', togglePlayPause);
    }
    
    // Previous button (skip back 10 seconds)
    if (prevBtn) {
        prevBtn.addEventListener('click', skipBackward);
    }
    
    // Next button (skip forward 30 seconds)
    if (nextBtn) {
        nextBtn.addEventListener('click', skipForward);
    }
    
    // Seekbar
    if (seekbar) {
        seekbar.addEventListener('input', function() {
            seekToPosition(this.value);
        });
    }
    
    // Volume slider
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            changeVolume(this.value);
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Don't trigger when typing in inputs
        if (e.target.matches('input, textarea, select')) return;
        
        switch(e.code) {
            case 'Space':
                e.preventDefault();
                togglePlayPause();
                break;
            case 'ArrowLeft':
                e.preventDefault();
                skipBackward();
                break;
            case 'ArrowRight':
                e.preventDefault();
                skipForward();
                break;
            case 'KeyM':
                e.preventDefault();
                toggleMute();
                break;
            case 'Escape':
                window.close();
                break;
        }
    });
    
    // Click anywhere to enable audio
    const enableAudio = function() {
        if (!hasUserInteracted) {
            console.log("👆 First user interaction detected");
            hasUserInteracted = true;
            
            // Try to play if audio is ready
            if (audio && audio.readyState >= 3 && !isPlaying) {
                console.log("🎵 Attempting to play after interaction");
                setTimeout(() => playAudio(), 100);
            }
        }
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
        
        @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .vinyl-record {
            animation: vinyl-spin 3s linear infinite;
            animation-play-state: paused;
        }
        
        @keyframes vinyl-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
        }
        
        .fa-spinner {
            animation: spin 1s linear infinite;
        }
    `;
    document.head.appendChild(style);
}

// ==========================
// ERROR HANDLING
// ==========================
function showError(message) {
    const container = document.querySelector('.player-container');
    if (!container) return;
    
    container.innerHTML = `
        <div style="
            text-align: center;
            padding: 40px 20px;
            color: white;
            height: 100vh;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            background: #121212;
        ">
            <div style="
                background: rgba(255, 50, 50, 0.2);
                padding: 30px;
                border-radius: 15px;
                max-width: 400px;
                width: 90%;
                border: 2px solid #ff4444;
            ">
                <i class="fas fa-exclamation-circle" style="
                    font-size: 50px;
                    color: #ff4444;
                    margin-bottom: 20px;
                "></i>
                <h3 style="margin-bottom: 15px; color: #ff4444;">Playback Error</h3>
                <p style="margin-bottom: 20px; color: #ddd; line-height: 1.5;">${message}</p>
                <div style="display: flex; gap: 10px; justify-content: center;">
                    <button onclick="retryPlayback()" style="
                        padding: 12px 24px;
                        background: chartreuse;
                        color: black;
                        border: none;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        Retry Playback
                    </button>
                    <button onclick="window.close()" style="
                        padding: 12px 24px;
                        background: #666;
                        color: white;
                        border: none;
                        border-radius: 8px;
                        font-weight: bold;
                        font-size: 14px;
                        cursor: pointer;
                    ">
                        Close Player
                    </button>
                </div>
            </div>
        </div>
    `;
}

// ==========================
// RETRY FUNCTION
// ==========================
function retryPlayback() {
    console.log("🔄 Retrying playback...");
    
    // Clean up and reinitialize
    if (audio) {
        audio.pause();
        audio.src = "";
        audio = null;
    }
    
    // Reset UI
    updateSongUI();
    
    // Reinitialize audio
    initializeAudio();
}

// ==========================
// GLOBAL FUNCTIONS
// ==========================
window.togglePlayPause = togglePlayPause;
window.toggleMute = toggleMute;
window.retryPlayback = retryPlayback;
window.skipBackward = skipBackward;
window.skipForward = skipForward;

// ==========================
// PAGE VISIBILITY HANDLING
// ==========================
document.addEventListener('visibilitychange', function() {
    if (document.hidden && audio && isPlaying) {
        console.log("📱 Page hidden, pausing audio");
        audio.pause();
    }
});

// ==========================
// WINDOW UNLOAD HANDLING
// ==========================
window.addEventListener('beforeunload', function() {
    console.log("🔚 Cleaning up player...");
    if (audio) {
        audio.pause();
        audio.src = "";
        audio = null;
    }
});

console.log("🎵 Player script loaded successfully!");