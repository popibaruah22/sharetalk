// ==========================
// GLOBAL VARIABLES
// ==========================
let audio = null;
let isPlaying = false;
let currentVolume = 0.7;

// ==========================
// ELEMENTS
// ==========================
let currentSongTitle, songThumbnail, playBtn, playIcon, seekbar;
let currentTimeEl, totalTimeEl, prevBtn, nextBtn, volumeSlider;
let vinylRecord, backgroundGradient, artistName;

// ==========================
// INITIALIZATION
// ==========================
document.addEventListener('DOMContentLoaded', function() {
    console.log("🚀 Player initializing...");
    
    // Get all elements
    getElements();
    
    // Get song data from URL
    const params = new URLSearchParams(window.location.search);
    const audioSrc = params.get("audio");
    const title = params.get("name");
    const thumbnail = params.get("thumbnail");
    
    console.log("📊 URL Parameters:", { audioSrc, title, thumbnail });
    
    if (!audioSrc) {
        showError("❌ No audio URL provided. Please go back and select a song.");
        return;
    }
    
    // Decode parameters
    const decodedAudioSrc = decodeURIComponent(audioSrc);
    const decodedTitle = title ? decodeURIComponent(title) : "Unknown Song";
    const decodedThumbnail = thumbnail ? decodeURIComponent(thumbnail) : "";
    
    console.log("🎵 Loading song:", decodedTitle);
    console.log("🔗 Audio URL:", decodedAudioSrc);
    
    // Set song info
    currentSongTitle.textContent = decodedTitle;
    
    // Set artist name
    artistName.textContent = extractArtistName(decodedTitle);
    
    // Handle thumbnail
    handleThumbnail(decodedThumbnail);
    
    // Initialize audio player
    initAudioPlayer(decodedAudioSrc);
    
    // Setup event listeners
    setupEventListeners();
});

// ==========================
// ELEMENT GETTER
// ==========================
function getElements() {
    currentSongTitle = document.getElementById("currentSongTitle");
    songThumbnail = document.getElementById("songThumbnail");
    playBtn = document.getElementById("playBtn");
    playIcon = playBtn ? playBtn.querySelector('i') : null;
    seekbar = document.getElementById("seekbar");
    currentTimeEl = document.getElementById("currentTime");
    totalTimeEl = document.getElementById("totalTime");
    prevBtn = document.getElementById("prevBtn");
    nextBtn = document.getElementById("nextBtn");
    volumeSlider = document.getElementById("volumeSlider");
    vinylRecord = document.querySelector('.vinyl-record');
    backgroundGradient = document.querySelector('.background-gradient');
    artistName = document.getElementById("artistName");
    
    console.log("✅ Elements loaded:", {
        currentSongTitle: !!currentSongTitle,
        songThumbnail: !!songThumbnail,
        playBtn: !!playBtn,
        seekbar: !!seekbar,
        volumeSlider: !!volumeSlider
    });
}

// ==========================
// HELPER FUNCTIONS
// ==========================
function extractArtistName(title) {
    if (!title) return "";
    
    // Try to extract artist name from common patterns
    if (title.includes('-')) {
        const parts = title.split('-');
        if (parts.length >= 2) {
            return parts[0].trim();
        }
    } else if (title.includes('by')) {
        const parts = title.split('by');
        if (parts.length >= 2) {
            return parts[1].trim();
        }
    } else if (title.includes('(')) {
        return title.split('(')[0].trim();
    }
    
    return "";
}

function handleThumbnail(thumbnailUrl) {
    if (thumbnailUrl && thumbnailUrl.trim() !== "") {
        songThumbnail.src = thumbnailUrl;
        songThumbnail.style.display = 'block';
        
        songThumbnail.onload = function() {
            console.log("✅ Thumbnail loaded successfully");
            setBackgroundGradient();
        };
        
        songThumbnail.onerror = function() {
            console.log("⚠️ Thumbnail failed to load, showing fallback");
            showFallbackThumbnail();
        };
    } else {
        console.log("ℹ️ No thumbnail provided, showing fallback");
        showFallbackThumbnail();
    }
}

function showFallbackThumbnail() {
    if (songThumbnail) {
        songThumbnail.style.display = 'none';
    }
    if (vinylRecord) {
        vinylRecord.style.display = 'flex';
    }
}

function setBackgroundGradient() {
    if (!backgroundGradient) return;
    
    // Set a nice gradient background
    backgroundGradient.style.background = `
        linear-gradient(180deg, 
        rgba(18, 18, 18, 0.9) 0%,
        rgba(30, 30, 30, 0.85) 20%,
        rgba(40, 40, 40, 0.8) 60%,
        #121212 100%)
    `;
}

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
        ">
            <div style="
                background: rgba(255, 50, 50, 0.2);
                padding: 30px;
                border-radius: 15px;
                max-width: 400px;
                width: 90%;
            ">
                <i class="fas fa-exclamation-circle" style="
                    font-size: 50px;
                    color: #ff4444;
                    margin-bottom: 20px;
                "></i>
                <h3 style="margin-bottom: 15px; color: #ff4444;">Error</h3>
                <p style="margin-bottom: 25px; color: #ddd;">${message}</p>
                <button onclick="window.close()" style="
                    padding: 12px 30px;
                    background: chartreuse;
                    color: black;
                    border: none;
                    border-radius: 25px;
                    font-weight: bold;
                    font-size: 16px;
                    cursor: pointer;
                    transition: transform 0.2s;
                ">
                    Close Player
                </button>
            </div>
        </div>
    `;
}

function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
}

// ==========================
// AUDIO PLAYER FUNCTIONS
// ==========================
function initAudioPlayer(audioSrc) {
    console.log("🎧 Initializing audio player...");
    
    // Create audio element
    audio = new Audio();
    audio.src = audioSrc;
    audio.volume = currentVolume;
    audio.preload = "auto";
    
    // Set initial volume on slider
    if (volumeSlider) {
        volumeSlider.value = currentVolume;
    }
    
    // Setup audio event listeners
    setupAudioEvents();
    
    // Load audio but don't auto-play
    loadAudio();
}

function loadAudio() {
    if (!audio) return;
    
    console.log("📥 Loading audio...");
    
    // Show loading state
    if (playIcon) {
        playIcon.className = "fas fa-spinner fa-spin";
    }
    if (playBtn) {
        playBtn.disabled = true;
    }
    
    // Load the audio
    audio.load();
    
    // Set timeout for loading
    const loadTimeout = setTimeout(() => {
        console.log("⏱️ Load timeout reached");
        updatePlayButtonState(false);
    }, 10000);
    
    // When audio is ready
    audio.addEventListener('canplay', function() {
        clearTimeout(loadTimeout);
        console.log("✅ Audio ready to play");
        updatePlayButtonState(false); // Set to pause state initially
        
        // Update time display
        updateTimeDisplay();
        
        // Update play button to show play icon (not playing yet)
        if (playIcon) {
            playIcon.className = "fas fa-play";
        }
        if (playBtn) {
            playBtn.disabled = false;
        }
    }, { once: true });
    
    // Handle errors
    audio.addEventListener('error', function() {
        clearTimeout(loadTimeout);
        console.error("❌ Audio error:", audio.error);
        updatePlayButtonState(false);
        
        let errorMessage = "Failed to load audio. ";
        switch(audio.error.code) {
            case 1:
                errorMessage += "Playback was aborted.";
                break;
            case 2:
                errorMessage += "Network error. Check your connection.";
                break;
            case 3:
                errorMessage += "Decoding error. File may be corrupted.";
                break;
            case 4:
                errorMessage += "Format not supported.";
                break;
            default:
                errorMessage += "Unknown error.";
        }
        
        showError(errorMessage);
    });
}

function setupAudioEvents() {
    if (!audio) return;
    
    // Time update - progress
    audio.addEventListener('timeupdate', function() {
        updateProgress();
        updateTimeDisplay();
    });
    
    // Metadata loaded - duration available
    audio.addEventListener('loadedmetadata', function() {
        console.log("📊 Metadata loaded, duration:", audio.duration);
        updateTimeDisplay();
        if (seekbar) {
            seekbar.max = 100;
        }
    });
    
    // Playing - actually playing
    audio.addEventListener('playing', function() {
        console.log("▶️ Audio is now playing");
        isPlaying = true;
        updatePlayButtonState(true);
        updateVinylAnimation();
    });
    
    // Pause - paused
    audio.addEventListener('pause', function() {
        console.log("⏸️ Audio paused");
        isPlaying = false;
        updatePlayButtonState(false);
        updateVinylAnimation();
    });
    
    // Ended - finished playing
    audio.addEventListener('ended', function() {
        console.log("🏁 Audio ended");
        isPlaying = false;
        audio.currentTime = 0;
        updatePlayButtonState(false);
        updateVinylAnimation();
        updateProgress();
        updateTimeDisplay();
    });
    
    // Waiting - buffering
    audio.addEventListener('waiting', function() {
        console.log("⏳ Audio buffering...");
        if (playIcon) {
            playIcon.className = "fas fa-spinner fa-spin";
        }
    });
    
    // Can play through - enough data to play without stopping
    audio.addEventListener('canplaythrough', function() {
        console.log("🎯 Audio can play through without stopping");
        if (playIcon && playIcon.className === "fas fa-spinner fa-spin") {
            playIcon.className = "fas fa-play";
        }
    });
}

function updatePlayButtonState(playing) {
    if (!playBtn || !playIcon) return;
    
    playBtn.disabled = false;
    
    if (playing) {
        playIcon.className = "fas fa-pause";
        if (playBtn.style.animation) {
            playBtn.style.animation = "";
        }
    } else {
        playIcon.className = "fas fa-play";
    }
}

function updateVinylAnimation() {
    if (!vinylRecord) return;
    
    if (isPlaying) {
        vinylRecord.style.animationPlayState = 'running';
    } else {
        vinylRecord.style.animationPlayState = 'paused';
    }
}

function updateProgress() {
    if (!audio || !audio.duration || !seekbar) return;
    
    const percentage = (audio.currentTime / audio.duration) * 100;
    seekbar.value = percentage;
}

function updateTimeDisplay() {
    if (!audio || !currentTimeEl || !totalTimeEl) return;
    
    currentTimeEl.textContent = formatTime(audio.currentTime);
    
    if (audio.duration && !isNaN(audio.duration)) {
        totalTimeEl.textContent = formatTime(audio.duration);
    } else {
        totalTimeEl.textContent = "0:00";
    }
}

// ==========================
// EVENT LISTENERS
// ==========================
function setupEventListeners() {
    console.log("🔗 Setting up event listeners...");
    
    // Play/Pause button - FIXED: Use click event properly
    if (playBtn) {
        // Remove any existing listeners
        const newPlayBtn = playBtn.cloneNode(true);
        playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
        playBtn = newPlayBtn;
        playIcon = playBtn.querySelector('i');
        
        playBtn.addEventListener('click', function(e) {
            console.log("🎮 Play button clicked, isPlaying:", isPlaying);
            e.preventDefault();
            e.stopPropagation();
            
            if (!audio) {
                console.log("❌ No audio element");
                return;
            }
            
            // Toggle play/pause
            if (isPlaying) {
                console.log("⏸️ Pausing audio");
                audio.pause();
            } else {
                console.log("▶️ Attempting to play audio");
                const playPromise = audio.play();
                
                if (playPromise !== undefined) {
                    playPromise
                        .then(() => {
                            console.log("✅ Play successful");
                            // Success - handled by 'playing' event
                        })
                        .catch(error => {
                            console.log("❌ Play failed:", error);
                            
                            // Show user they need to interact first
                            if (playIcon) {
                                playIcon.className = "fas fa-play";
                            }
                            
                            // Add visual cue
                            playBtn.style.animation = "pulse 2s infinite";
                            
                            // Remove animation after 3 seconds
                            setTimeout(() => {
                                playBtn.style.animation = "";
                            }, 3000);
                        });
                }
            }
        });
    }
    
    // Previous button (skip back 10 seconds)
    if (prevBtn) {
        prevBtn.addEventListener('click', function() {
            console.log("⏪ Previous button clicked");
            if (!audio) return;
            
            audio.currentTime = Math.max(0, audio.currentTime - 10);
            updateProgress();
            updateTimeDisplay();
        });
    }
    
    // Next button (skip forward 30 seconds)
    if (nextBtn) {
        nextBtn.addEventListener('click', function() {
            console.log("⏩ Next button clicked");
            if (!audio) return;
            
            if (audio.duration && !isNaN(audio.duration)) {
                audio.currentTime = Math.min(audio.duration, audio.currentTime + 30);
            } else {
                audio.currentTime += 30;
            }
            updateProgress();
            updateTimeDisplay();
        });
    }
    
    // Seekbar
    if (seekbar) {
        seekbar.addEventListener('input', function() {
            if (!audio || !audio.duration) return;
            
            const seekTime = (this.value / 100) * audio.duration;
            audio.currentTime = seekTime;
            updateTimeDisplay();
        });
        
        seekbar.addEventListener('change', function() {
            if (!audio || !audio.duration) return;
            
            const seekTime = (this.value / 100) * audio.duration;
            audio.currentTime = seekTime;
            updateTimeDisplay();
        });
    }
    
    // Volume slider
    if (volumeSlider) {
        volumeSlider.addEventListener('input', function() {
            currentVolume = parseFloat(this.value);
            console.log("🔊 Volume changed to:", currentVolume);
            if (audio) {
                audio.volume = currentVolume;
            }
        });
    }
    
    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Prevent default only for specific keys
        if (e.code === 'Space') {
            e.preventDefault(); // Prevent page scroll
            console.log("⌨️ Space key pressed");
            if (playBtn) playBtn.click();
        } else if (e.code === 'KeyK') {
            e.preventDefault();
            console.log("⌨️ K key pressed");
            if (playBtn) playBtn.click();
        } else if (e.code === 'ArrowLeft' || e.code === 'KeyJ') {
            e.preventDefault();
            console.log("⌨️ Left arrow/J key pressed");
            if (prevBtn) prevBtn.click();
        } else if (e.code === 'ArrowRight' || e.code === 'KeyL') {
            e.preventDefault();
            console.log("⌨️ Right arrow/L key pressed");
            if (nextBtn) nextBtn.click();
        } else if (e.code === 'Escape') {
            console.log("⌨️ Escape key pressed");
            window.close();
        } else if (e.code === 'KeyM') {
            e.preventDefault();
            console.log("⌨️ M key pressed");
            toggleMute();
        }
    });
    
    // Also allow clicking anywhere on the document to play on first interaction
    let firstInteraction = true;
    document.addEventListener('click', function(e) {
        // Don't trigger if clicking on player controls
        if (e.target.closest('.player-controls') || 
            e.target.closest('.player-header') ||
            e.target.closest('.volume-control')) {
            return;
        }
        
        if (firstInteraction && !isPlaying) {
            console.log("👆 First user interaction detected");
            firstInteraction = false;
            
            // Try to play audio on first click
            if (audio && audio.paused) {
                console.log("▶️ Attempting play on first interaction");
                audio.play().catch(error => {
                    console.log("❌ Play on interaction failed:", error);
                });
            }
        }
    });
    
    // Add CSS for pulse animation
    const style = document.createElement('style');
    style.textContent = `
        @keyframes pulse {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(127, 255, 0, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(127, 255, 0, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(127, 255, 0, 0); }
        }
    `;
    document.head.appendChild(style);
    
    console.log("✅ Event listeners setup complete");
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
// WINDOW EVENT LISTENERS
// ==========================
window.addEventListener('beforeunload', function() {
    if (audio) {
        audio.pause();
        audio = null;
    }
});

// Make functions available globally
window.toggleMute = toggleMute;

console.log("🎵 Player script loaded successfully!");