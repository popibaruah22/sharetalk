// Configuration
const BACKEND_URL = 'https://musten-y.onrender.com';
let GITHUB_CONFIG = null;
let CONFIG = null;

// Global variables
let selectedImages = [];

// DOM Elements
const adForm = document.getElementById('adForm');
const imageInput = document.getElementById('imageInput');
const uploadArea = document.getElementById('uploadArea');
const imagePreviewContainer = document.getElementById('imagePreviewContainer');
const selectedCounter = document.getElementById('selectedCounter');
const selectedCount = document.getElementById('selectedCount');
const emptyState = document.getElementById('emptyState');
const loadingOverlay = document.getElementById('loadingOverlay');
const loadingSubtext = document.getElementById('loadingSubtext');
const statusMessage = document.getElementById('statusMessage');

// Initialize
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // Get credentials from backend
        await loadCredentials();
        setupEventListeners();
        updateImageCounter();
    } catch (error) {
        showMessage('Failed to load credentials from backend. Please start the backend server.', 'error');
        console.error('Initialization error:', error);
    }
});

// Load credentials from backend
async function loadCredentials() {
    try {
        const response = await fetch(`${BACKEND_URL}/api/credentials`);
        const result = await response.json();
        
        if (result.success) {
            GITHUB_CONFIG = result.credentials;
            console.log('GitHub credentials loaded:', GITHUB_CONFIG.username);
        } else {
            throw new Error(result.error || 'Failed to load credentials');
        }
        
        // Load configuration
        const configResponse = await fetch(`${BACKEND_URL}/api/config`);
        const configResult = await configResponse.json();
        
        if (configResult.success) {
            CONFIG = configResult.config;
            console.log('Configuration loaded:', CONFIG);
        }
        
    } catch (error) {
        console.error('Error loading credentials:', error);
        throw error;
    }
}

// Setup event listeners
function setupEventListeners() {
    // File input change
    imageInput.addEventListener('change', handleFileSelect);
    
    // Drag and drop
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    
    // Form submission
    adForm.addEventListener('submit', handleFormSubmit);
    
    // Click upload area
    uploadArea.addEventListener('click', () => imageInput.click());
}

// Handle file selection
function handleFileSelect(event) {
    const files = Array.from(event.target.files);
    processFiles(files);
}

// Handle drag over
function handleDragOver(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.remove('dragover');
}

// Handle drop
function handleDrop(event) {
    event.preventDefault();
    event.stopPropagation();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(event.dataTransfer.files);
    processFiles(files);
}

// Process selected files
function processFiles(files) {
    if (!CONFIG) {
        showMessage('Configuration not loaded. Please refresh the page.', 'error');
        return;
    }
    
    // Clear existing images since max is 1
    if (files.length > 0) {
        selectedImages = [];
    }
    
    files.forEach(file => {
        // Validate file type
        if (!CONFIG.allowedTypes.includes(file.type)) {
            showMessage(`File ${file.name} is not a supported image format.`, 'error');
            return;
        }
        
        // Validate file size
        if (file.size > CONFIG.maxFileSize) {
            showMessage(`File ${file.name} exceeds ${formatFileSize(CONFIG.maxFileSize)} limit.`, 'error');
            return;
        }
        
        // Add to selected images (max 1)
        if (selectedImages.length === 0) {
            selectedImages.push({
                file: file,
                id: Date.now() + Math.random(),
                name: file.name,
                size: formatFileSize(file.size)
            });
        }
    });
    
    updateImagePreviews();
    updateImageCounter();
    imageInput.value = '';
}

// Update image previews
function updateImagePreviews() {
    // Hide empty state
    emptyState.style.display = selectedImages.length > 0 ? 'none' : 'block';
    
    // Create image grid if needed
    if (selectedImages.length > 0) {
        if (!imagePreviewContainer.querySelector('.image-grid')) {
            const imageGrid = document.createElement('div');
            imageGrid.className = 'image-grid';
            imagePreviewContainer.appendChild(imageGrid);
        }
        
        const imageGrid = imagePreviewContainer.querySelector('.image-grid');
        imageGrid.innerHTML = '';
        
        selectedImages.forEach((image, index) => {
            const reader = new FileReader();
            
            reader.onload = function(e) {
                const imageItem = document.createElement('div');
                imageItem.className = 'image-item';
                imageItem.dataset.id = image.id;
                
                imageItem.innerHTML = `
                    <img src="${e.target.result}" alt="${image.name}" class="image-preview">
                    <div class="image-overlay"></div>
                    <div class="image-info">${image.name} (${image.size})</div>
                    <div class="image-actions">
                        <button type="button" class="remove-btn" data-id="${image.id}">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                `;
                
                imageGrid.appendChild(imageItem);
                
                // Add event listener to remove button
                const removeBtn = imageItem.querySelector('.remove-btn');
                removeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    removeImage(image.id);
                });
            };
            
            reader.readAsDataURL(image.file);
        });
    }
}

// Remove image
function removeImage(imageId) {
    selectedImages = selectedImages.filter(img => img.id !== imageId);
    updateImagePreviews();
    updateImageCounter();
}

// Update image counter
function updateImageCounter() {
    selectedCount.textContent = selectedImages.length;
    selectedCounter.style.display = selectedImages.length > 0 ? 'block' : 'none';
    selectedCounter.innerHTML = `<span id="selectedCount">${selectedImages.length}</span> of ${CONFIG?.maxImages || 1} image selected`;
}

// Format file size
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Handle form submission
async function handleFormSubmit(event) {
    event.preventDefault();
    
    if (!GITHUB_CONFIG) {
        showMessage('GitHub credentials not loaded. Please refresh the page.', 'error');
        return;
    }
    
    // Get form values
    const adTitle = document.getElementById('adTitle').value.trim();
    const adDescription = document.getElementById('adDescription').value.trim();
    const visitUrl = document.getElementById('visitUrl').value.trim();
    
    // Validate URL
    if (!isValidUrl(visitUrl)) {
        showMessage('Please enter a valid URL starting with http:// or https://', 'error');
        return;
    }
    
    // Show loading
    showLoading('Creating your ad...');
    
    try {
        // Step 1: Get next available ad number
        loadingSubtext.textContent = 'Checking existing ads...';
        const nextAdNumber = await getNextAdNumber();
        const repoName = `ad-${nextAdNumber}`;
        
        // Step 2: Create repository
        loadingSubtext.textContent = 'Creating Upload...';
        await createRepository(repoName, adTitle);
        
        // Step 3: Upload text files
        loadingSubtext.textContent = 'Uploading ad details...';
        await uploadTextFile(repoName, 'title.txt', adTitle);
        await uploadTextFile(repoName, 'description.txt', adDescription);
        await uploadTextFile(repoName, 'visit.txt', visitUrl);
        
        // Step 4: Upload image if exists
        if (selectedImages.length > 0) {
            loadingSubtext.textContent = 'Uploading image...';
            const image = selectedImages[0];
            await uploadImageFile(repoName, 'ad-image.jpg', image.file);
        }
        
        // Success
        hideLoading();
        showMessage(`Ad created successfully! Repository: ${repoName} (Ad ${nextAdNumber})`, 'success');
        
        // Reset form after delay
        setTimeout(resetForm, 2000);
        
    } catch (error) {
        hideLoading();
        showMessage(`Error: ${error.message}`, 'error');
        console.error('Error creating ad:', error);
    }
}

// Get next available ad number
async function getNextAdNumber() {
    try {
        const response = await fetch(
            `${GITHUB_CONFIG.apiBase}/user/repos?type=private&per_page=100`,
            {
                headers: getGitHubHeaders()
            }
        );
        
        if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
        }
        
        const repos = await response.json();
        
        // Filter for ad repositories
        const adRepos = repos.filter(repo => 
            repo.name.startsWith('ad-') && 
            !repo.fork && 
            repo.private === true
        );
        
        // Extract numbers from ad repositories
        const adNumbers = adRepos.map(repo => {
            const match = repo.name.match(/^ad-(\d+)$/);
            return match ? parseInt(match[1]) : 0;
        }).filter(num => num > 0);
        
        // Find the next available number
        if (adNumbers.length === 0) {
            return 1;
        }
        
        const maxNumber = Math.max(...adNumbers);
        return maxNumber + 1;
        
    } catch (error) {
        console.error('Error getting next ad number:', error);
        return 1; // Default to 1 if error
    }
}

// Create GitHub repository
async function createRepository(repoName, title) {
    const response = await fetch(
        `${GITHUB_CONFIG.apiBase}/user/repos`,
        {
            method: 'POST',
            headers: {
                ...getGitHubHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: repoName,
                description: `Ad: ${title.substring(0, 100)}`,
                private: true,
                auto_init: false,
                has_issues: false,
                has_projects: false,
                has_wiki: false
            })
        }
    );
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to upload');
    }
    
    return await response.json();
}

// Upload text file to GitHub
async function uploadTextFile(repoName, fileName, content) {
    const response = await fetch(
        `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repoName}/contents/${fileName}`,
        {
            method: 'PUT',
            headers: {
                ...getGitHubHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: `Add ${fileName}`,
                content: btoa(unescape(encodeURIComponent(content))),
                branch: 'main'
            })
        }
    );
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to upload ${fileName}: ${error.message}`);
    }
    
    return await response.json();
}

// Upload image file to GitHub
async function uploadImageFile(repoName, fileName, imageFile) {
    // Convert image to base64
    const base64Data = await convertImageToBase64(imageFile);
    const base64Content = base64Data.split(',')[1]; // Remove data URL prefix
    
    const response = await fetch(
        `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repoName}/contents/${fileName}`,
        {
            method: 'PUT',
            headers: {
                ...getGitHubHeaders(),
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                message: 'Add ad image',
                content: base64Content,
                branch: 'main'
            })
        }
    );
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(`Failed to upload image: ${error.message}`);
    }
    
    return await response.json();
}

// Get GitHub headers
function getGitHubHeaders() {
    return {
        'Authorization': `token ${GITHUB_CONFIG.token}`,
        'Accept': 'application/vnd.github.v3+json'
    };
}

// Convert image to base64
function convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read image file'));
        reader.readAsDataURL(file);
    });
}

// Validate URL
function isValidUrl(string) {
    try {
        const url = new URL(string);
        return url.protocol === 'http:' || url.protocol === 'https:';
    } catch (_) {
        return false;
    }
}

// Show message
function showMessage(message, type = 'info') {
    statusMessage.textContent = message;
    statusMessage.className = `status-message status-${type}`;
    
    // Auto hide after 5 seconds
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}

// Show loading overlay
function showLoading(text) {
    loadingSubtext.textContent = text || 'Please wait...';
    loadingOverlay.style.display = 'flex';
}

// Hide loading overlay
function hideLoading() {
    loadingOverlay.style.display = 'none';
}

// Reset form
function resetForm() {
    adForm.reset();
    selectedImages = [];
    updateImagePreviews();
    updateImageCounter();
    showMessage('Form has been reset', 'success');
}