// ads.js - Fetch and display ads with batch loading
document.addEventListener('DOMContentLoaded', async function() {
    const BACKEND_URL = 'https://musten-y.onrender.com';
    let GITHUB_CONFIG = null;
    
    // Batch configuration
    const BATCH_SIZE = 5;
    const BATCH_DELAY = 1000; // 1 second between batches
    const REPOS_PER_PAGE = 100; // GitHub API max per page
    
    // Main container for ads
    let adsContainer = document.querySelector('.ads-container');
    if (!adsContainer) {
        adsContainer = document.createElement('div');
        adsContainer.className = 'ads-container';
        adsContainer.style.cssText = `
            margin-top: 120px;
            padding: 20px;
            display: flex;
            flex-direction: column;
            gap: 30px;
            overflow-y: auto;
            max-height: calc(100vh - 260px);
        `;
        document.body.insertBefore(adsContainer, document.querySelector('.bottom-bar'));
    }
    
    // Create loading animation
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = `
        <div class="spinner"></div>
        <p class="loading-text">Loading ads...</p>
        <div class="loading-progress" id="loadingProgress"></div>
    `;
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 1000;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 20px;
        background: rgba(0, 0, 0, 0.8);
        padding: 30px;
        border-radius: 15px;
        border: 2px solid chartreuse;
    `;
    document.body.appendChild(loadingDiv);
    
    // Add CSS for animations
    const style = document.createElement('style');
    style.textContent = `
        .spinner {
            width: 70px;
            height: 70px;
            border: 8px solid rgba(0, 0, 0, 0.1);
            border-left-color: chartreuse;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        .loading-text {
            color: chartreuse;
            font-size: 24px;
            font-weight: bold;
        }
        
        .loading-progress {
            color: white;
            font-size: 14px;
            opacity: 0.8;
            margin-top: 10px;
        }
        
        .ad-card {
            animation: fadeIn 0.5s ease-out;
        }
        
        .ad-image {
            width: 100%;
            height: 400px;
            object-fit: contain;
            background: black;
            display: block;
        }
        
        .no-image {
            width: 100%;
            height: 400px;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 18px;
        }
        
        .image-loading {
            width: 100%;
            height: 400px;
            background: rgba(0, 0, 0, 0.7);
            display: flex;
            align-items: center;
            justify-content: center;
            color: chartreuse;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .ads-container::-webkit-scrollbar {
            width: 8px;
        }
        .ads-container::-webkit-scrollbar-track {
            background: transparent;
        }
        .ads-container::-webkit-scrollbar-thumb {
            background: chartreuse;
            border-radius: 4px;
        }
        .ads-container::-webkit-scrollbar-thumb:hover {
            background: #7fff00;
        }
        
        @media (max-width: 768px) {
            .ad-card {
                margin: 0 10px 30px 10px;
                border-radius: 10px;
            }
            
            .ad-image {
                height: 300px;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Load credentials from backend
    async function loadCredentials() {
        try {
            const response = await fetch(`${BACKEND_URL}/api/credentials`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const result = await response.json();
            
            if (result.success) {
                GITHUB_CONFIG = result.credentials;
                console.log('✅ credentials loaded:', GITHUB_CONFIG.username);
                return true;
            } else {
                throw new Error(result.error || 'Failed to load credentials');
            }
        } catch (error) {
            console.error('❌ Error loading credentials:', error);
            showError('Failed to load GitHub credentials from backend.');
            return false;
        }
    }
    
    // Get GitHub headers
    function getGitHubHeaders() {
        return {
            'Authorization': `token ${GITHUB_CONFIG.token}`,
            'Accept': 'application/vnd.github.v3+json'
        };
    }
    
    // Get authenticated image URL
    async function getImageUrl(repoName, fileName) {
        try {
            // First get file info to get download URL
            const response = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repoName}/contents/${fileName}`,
                {
                    headers: getGitHubHeaders()
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to get image info: ${fileName}`);
            }
            
            const fileData = await response.json();
            
            // Use download_url if available, otherwise construct raw URL
            if (fileData.download_url) {
                return fileData.download_url;
            } else {
                // Fallback to raw URL with authentication
                return `https://raw.githubusercontent.com/${GITHUB_CONFIG.username}/${repoName}/main/${fileName}`;
            }
            
        } catch (error) {
            console.error(`Error getting image URL for ${fileName}:`, error);
            return null;
        }
    }
    
    // Fetch ALL ad repositories with pagination
    async function fetchAllAdRepos() {
        try {
            console.log('📡 Fetching ALL ad repositories...');
            
            let allRepos = [];
            let page = 1;
            let hasMore = true;
            
            while (hasMore) {
                console.log(`📄 Fetching page ${page}...`);
                
                const response = await fetch(
                    `${GITHUB_CONFIG.apiBase}/user/repos?type=private&sort=updated&direction=desc&page=${page}&per_page=${REPOS_PER_PAGE}`,
                    {
                        headers: getGitHubHeaders()
                    }
                );
                
                if (!response.ok) {
                    throw new Error(` API error: ${response.status}`);
                }
                
                const repos = await response.json();
                
                // If no repos returned, we're done
                if (repos.length === 0) {
                    hasMore = false;
                    console.log(`✅ Reached end of repositories at page ${page}`);
                    break;
                }
                
                // Filter for ad repositories
                const adRepos = repos.filter(repo => 
                    repo.name.startsWith('ad-') && 
                    !repo.fork && 
                    repo.private === true
                );
                
                // Add to our collection
                allRepos = [...allRepos, ...adRepos];
                console.log(`📊 Page ${page}: Found ${adRepos.length} ad repos (Total: ${allRepos.length})`);
                
                // Check if we got fewer repos than requested (end of list)
                if (repos.length < REPOS_PER_PAGE) {
                    hasMore = false;
                    console.log(`✅ Last page reached: ${repos.length} repos on page ${page}`);
                }
                
                page++;
                
                // Safety limit: prevent infinite loops
                if (page > 50) { // Max 5000 repos (50 pages × 100)
                    console.warn('⚠️  Safety limit reached: Stopped at 50 pages');
                    hasMore = false;
                }
            }
            
            console.log(`✅ Total ad repositories found: ${allRepos.length}`);
            return allRepos;
            
        } catch (error) {
            console.error('❌ Error fetching all repos:', error);
            throw error;
        }
    }
    
    // Get repository files
    async function getRepoFiles(repoName) {
        try {
            const response = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repoName}/contents`,
                {
                    headers: getGitHubHeaders()
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch files from ${repoName}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error(`❌ Error fetching files from ${repoName}:`, error);
            return [];
        }
    }
    
    // Get file content
    async function getFileContent(repoName, filePath) {
        try {
            const response = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repoName}/contents/${filePath}`,
                {
                    headers: getGitHubHeaders()
                }
            );
            
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filePath}`);
            }
            
            const fileData = await response.json();
            // Decode base64 content
            return atob(fileData.content);
        } catch (error) {
            console.error(`❌ Error fetching ${filePath}:`, error);
            return null;
        }
    }
    
    // Process a single ad repo
    async function processAdRepo(repo) {
        try {
            const adNumber = repo.name.match(/^ad-(\d+)$/)?.[1] || '?';
            
            const adData = {
                repoName: repo.name,
                adNumber: adNumber,
                title: '',
                description: '',
                visitUrl: '',
                images: [],
                updatedAt: repo.updated_at
            };
            
            // Get files from the repo
            const files = await getRepoFiles(repo.name);
            
            // Process files
            for (const file of files) {
                if (file.type === 'file') {
                    if (file.name === 'title.txt') {
                        adData.title = await getFileContent(repo.name, file.name);
                    } else if (file.name === 'description.txt') {
                        adData.description = await getFileContent(repo.name, file.name);
                    } else if (file.name === 'visit.txt') {
                        adData.visitUrl = await getFileContent(repo.name, file.name);
                    } else if (file.name.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
                        // Get authenticated image URL
                        const imageUrl = await getImageUrl(repo.name, file.name);
                        if (imageUrl) {
                            adData.images.push({
                                name: file.name,
                                url: imageUrl
                            });
                        }
                    }
                }
            }
            
            console.log(`✅ Processed ad ${adNumber}: ${adData.title || 'No title'}`);
            return adData;
            
        } catch (error) {
            console.error(`❌ Error processing repo ${repo.name}:`, error);
            return null;
        }
    }
    
    // Load image with authentication
    function loadImageWithAuth(imgElement, imageUrl) {
        return new Promise((resolve, reject) => {
            // Show loading state
            imgElement.style.opacity = '0';
            
            // Create a fetch request with authentication
            fetch(imageUrl, {
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.token}`
                }
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to load image');
                }
                return response.blob();
            })
            .then(blob => {
                const url = URL.createObjectURL(blob);
                imgElement.onload = () => {
                    imgElement.style.opacity = '1';
                    resolve();
                };
                imgElement.onerror = () => reject(new Error('Image load failed'));
                imgElement.src = url;
            })
            .catch(error => {
                console.error('Image load error:', error);
                reject(error);
            });
        });
    }
    
    // Display ad card
    function displayAdCard(adData) {
        // Skip if missing essential data
        if (!adData.title || !adData.description || !adData.visitUrl) {
            console.warn(`Skipping repo ${adData.repoName} - missing essential data`);
            return null;
        }
        
        // Create ad card
        const adCard = document.createElement('div');
        adCard.className = 'ad-card';
        adCard.style.cssText = `
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid white;
            border-radius: 15px;
            padding: 0;
            margin-bottom: 40px;
            backdrop-filter: blur(10px);
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
            width: 100%;
            opacity: 0;
            animation: fadeIn 0.5s ease-out forwards;
        `;
        
        // Title header
        const cardHeader = document.createElement('div');
        cardHeader.style.cssText = `
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            align-items: center;
            justify-content: space-between;
            flex-wrap: wrap;
        `;
        
        // Title
        const title = document.createElement('h2');
        title.textContent = adData.title || 'Untitled Ad';
        title.style.cssText = `
            color: chartreuse;
            margin: 0;
            font-size: 20px;
            font-weight: bold;
            flex-grow: 1;
            margin-right: 10px;
        `;
        
        // Ad number badge
        const numberBadge = document.createElement('span');
        numberBadge.textContent = ``;
        numberBadge.style.cssText = `
            background: chartreuse;
            color: black;
            padding: 4px 10px;
            border-radius: 12px;
            font-size: 12px;
            font-weight: bold;
        `;
        
        cardHeader.appendChild(title);
        cardHeader.appendChild(numberBadge);
        adCard.appendChild(cardHeader);
        
        // Images section
        const imageContainer = document.createElement('div');
        imageContainer.style.cssText = `
            width: 100%;
            height: 400px;
            overflow: hidden;
            background: black;
            position: relative;
        `;
        
        if (adData.images.length > 0) {
            // Create loading indicator
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'image-loading';
            loadingDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading image...';
            imageContainer.appendChild(loadingDiv);
            
            // Create image element
            const imgElement = document.createElement('img');
            imgElement.className = 'ad-image';
            imgElement.alt = adData.images[0].name || 'Ad image';
            imgElement.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                display: block;
                transition: opacity 0.3s ease;
            `;
            
            // Load image with authentication
            loadImageWithAuth(imgElement, adData.images[0].url)
                .then(() => {
                    // Remove loading indicator
                    loadingDiv.remove();
                    imgElement.style.opacity = '1';
                })
                .catch(error => {
                    console.error('Failed to load image:', error);
                    loadingDiv.innerHTML = `
                        <div style="text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                            <div>Image not available</div>
                        </div>
                    `;
                });
            
            imageContainer.appendChild(imgElement);
            
        } else {
            // No image placeholder
            const noImageDiv = document.createElement('div');
            noImageDiv.className = 'no-image';
            noImageDiv.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                    <div>No image available</div>
                </div>
            `;
            imageContainer.appendChild(noImageDiv);
        }
        
        adCard.appendChild(imageContainer);
        
        // Description section
        const descriptionContainer = document.createElement('div');
        descriptionContainer.style.cssText = `
            padding: 20px;
        `;
        
        const description = document.createElement('p');
        description.textContent = adData.description || 'No description available';
        description.style.cssText = `
            color: white;
            margin: 0 0 25px 0;
            line-height: 1.6;
            font-size: 16px;
            white-space: pre-line;
        `;
        descriptionContainer.appendChild(description);
        
        // Visit button
        if (adData.visitUrl) {
            const visitButton = document.createElement('button');
            visitButton.textContent = 'VISIT WEBSITE';
            visitButton.style.cssText = `
                background: chartreuse;
                color: black;
                border: none;
                padding: 14px 28px;
                border-radius: 25px;
                font-size: 16px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
                display: block;
                margin: 0 auto 20px auto;
                width: 90%;
                max-width: 300px;
                text-transform: uppercase;
                letter-spacing: 1px;
            `;
            
            visitButton.onmouseover = () => {
                visitButton.style.transform = 'scale(1.03)';
                visitButton.style.boxShadow = '0 0 15px chartreuse';
            };
            
            visitButton.onmouseout = () => {
                visitButton.style.transform = 'scale(1)';
                visitButton.style.boxShadow = 'none';
            };
            
            visitButton.onclick = () => {
                window.open(adData.visitUrl.trim(), '_blank');
            };
            
            descriptionContainer.appendChild(visitButton);
        }
        
        adCard.appendChild(descriptionContainer);
        
        return adCard;
    }
    
    // Display ads function
    function displayAds(adsData) {
        // Clear container only if it's the first display
        const isFirstDisplay = adsContainer.children.length === 0;
        if (isFirstDisplay) {
            adsContainer.innerHTML = '';
        }
        
        // Sort by updated date (newest first)
        const sortedAds = [...adsData].sort((a, b) => 
            new Date(b.updatedAt) - new Date(a.updatedAt)
        );
        
        // Remove duplicates
        const uniqueAds = [];
        const seenRepos = new Set();
        
        sortedAds.forEach(ad => {
            if (!seenRepos.has(ad.repoName)) {
                seenRepos.add(ad.repoName);
                uniqueAds.push(ad);
            }
        });
        
        // Clear and redisplay all ads
        adsContainer.innerHTML = '';
        
        // Display all ads
        uniqueAds.forEach(adData => {
            const adCard = displayAdCard(adData);
            if (adCard) {
                adsContainer.appendChild(adCard);
            }
        });
        
        console.log(`✅ Displayed ${uniqueAds.length} ads`);
    }
    
    // Show error message
    function showError(message) {
        loadingDiv.style.display = 'none';
        
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.innerHTML = `
            <div style="
                background: rgba(255, 0, 0, 0.1);
                border: 1px solid red;
                border-radius: 10px;
                padding: 20px;
                margin: 20px;
                text-align: center;
            ">
                <p style="color: red; font-size: 18px; margin: 0;">${message}</p>
            </div>
        `;
        adsContainer.appendChild(errorDiv);
    }
    
    // Show success message
    function showSuccess(message) {
        loadingDiv.style.display = 'none';
        
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.innerHTML = `
            <div style="
                background: rgba(0, 255, 0, 0.1);
                border: 1px solid chartreuse;
                border-radius: 10px;
                padding: 20px;
                margin: 20px;
                text-align: center;
            ">
                <p style="color: chartreuse; font-size: 18px; margin: 0;">${message}</p>
            </div>
        `;
        adsContainer.appendChild(successDiv);
    }
    
    // Main function to load ads with batch processing
    async function loadAds() {
        console.log('🚀 Starting to load ads with batch processing...');
        
        // Reset state
        adsContainer.innerHTML = '';
        loadingDiv.style.display = 'flex';
        
        try {
            // Load credentials first
            if (!GITHUB_CONFIG) {
                const credentialsLoaded = await loadCredentials();
                if (!credentialsLoaded) {
                    return;
                }
            }
            
            // Update loading text
            const loadingProgress = document.getElementById('loadingProgress');
            loadingProgress.textContent = 'Fetching all repositories...';
            
            // Get ALL ad repos with pagination
            const repos = await fetchAllAdRepos();
            
            if (repos.length === 0) {
                loadingDiv.style.display = 'none';
                showSuccess('No ads found yet. Create your first ad!');
                return;
            }
            
            console.log(`📊 Processing ${repos.length} ads in batches of ${BATCH_SIZE}...`);
            
            // Sort repos by updated date (newest first)
            repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            
            // Variables for batch processing
            let processedAds = [];
            const totalBatches = Math.ceil(repos.length / BATCH_SIZE);
            
            // Process and display first batch immediately
            loadingProgress.textContent = `Processing first ${BATCH_SIZE} ads...`;
            
            for (let i = 0; i < Math.min(BATCH_SIZE, repos.length); i++) {
                const adData = await processAdRepo(repos[i]);
                if (adData) {
                    processedAds.push(adData);
                }
            }
            
            // Display first batch immediately
            if (processedAds.length > 0) {
                displayAds(processedAds);
                loadingDiv.style.display = 'none';
                console.log(`✅ First batch (${processedAds.length} ads) displayed immediately`);
            } else {
                loadingProgress.textContent = 'No valid ads found in first batch...';
            }
            
            // Process remaining batches in background with delay
            for (let batch = 1; batch < totalBatches; batch++) {
                // Wait before next batch
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                
                // Calculate batch range
                const startIndex = batch * BATCH_SIZE;
                const endIndex = Math.min(startIndex + BATCH_SIZE, repos.length);
                
                console.log(`🔄 Processing batch ${batch + 1}/${totalBatches} (ads ${startIndex + 1}-${endIndex})`);
                
                // Process this batch in parallel
                const batchRepos = repos.slice(startIndex, endIndex);
                const batchPromises = batchRepos.map(repo => processAdRepo(repo));
                const batchResults = await Promise.all(batchPromises);
                
                // Add valid ads to collection
                batchResults.forEach(ad => {
                    if (ad) {
                        processedAds.push(ad);
                    }
                });
                
                // Silently update display with all ads processed so far
                displayAds(processedAds);
                
                // Show loading indicator again if it was hidden and we have more batches
                if (batch < totalBatches - 1 && loadingDiv.style.display === 'none') {
                    loadingDiv.style.display = 'flex';
                    loadingProgress.textContent = `Loading more ads... (${processedAds.length} loaded)`;
                    
                    // Hide loading indicator again after 1 second
                    setTimeout(() => {
                        if (loadingDiv.style.display !== 'none') {
                            loadingDiv.style.display = 'none';
                        }
                    }, 1000);
                }
            }
            
            // Final update
            console.log(`✅ Completed! Processed ${processedAds.length} valid ads out of ${repos.length} repositories`);
            
            if (processedAds.length === 0) {
                showError('No valid ads found. Make sure each ad has title, description, and URL.');
            } else {
                // Final refresh to ensure all ads are displayed
                displayAds(processedAds);
                console.log(`🎉 All ${processedAds.length} ads loaded and displayed!`);
            }
            
        } catch (error) {
            console.error('❌ Error in loadAds:', error);
            showError('Failed to load ads. Check console for details.');
            loadingDiv.style.display = 'none';
        }
    }
    
    // Add refresh button
    const appBar = document.querySelector('.app-bar');
    if (appBar) {
        const refreshButton = document.createElement('button');
        refreshButton.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Refresh';
        refreshButton.style.cssText = `
            background: black;
            margin-top: 20px;
            margin-bottom: 20px;
            margin-right: 70px;
            font-size: 15px;
            font-weight: 900;
            border: 2px solid white;
            font-family: serif;
            border-radius: 15px;
            min-height: 50px;
            color: white;
            width: 15%;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-left: auto;
        `;
        
        refreshButton.onmouseover = () => {
            refreshButton.style.background = 'chartreuse';
            refreshButton.style.color = 'black';
            refreshButton.style.borderColor = 'chartreuse';
        };
        
        refreshButton.onmouseout = () => {
            refreshButton.style.background = 'black';
            refreshButton.style.color = 'white';
            refreshButton.style.borderColor = 'white';
        };
        
        refreshButton.onclick = () => {
            console.log('🔄 Refreshing ads...');
            loadAds();
        };
        
        appBar.appendChild(refreshButton);
    }
    
    // Add status indicator
    const statusIndicator = document.createElement('div');
    statusIndicator.id = 'status-indicator';
    statusIndicator.style.cssText = `
        position: fixed;
        top: 10px;
        right: 10px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 5px 10px;
        border-radius: 5px;
        font-size: 12px;
        z-index: 1001;
        display: none;
    `;
    document.body.appendChild(statusIndicator);
    
    // Check backend connection
    async function checkBackend() {
        try {
            const response = await fetch(`${BACKEND_URL}/`);
            if (response.ok) {
                statusIndicator.textContent = 'Loaded';
                statusIndicator.style.color = 'chartreuse';
                statusIndicator.style.display = 'block';
                return true;
            }
        } catch (error) {
            statusIndicator.textContent = '❌ Backend Offline';
            statusIndicator.style.color = 'red';
            statusIndicator.style.display = 'block';
            return false;
        }
    }
    
    // Initialize
    checkBackend();
    
    // Start loading ads
    loadAds();
});