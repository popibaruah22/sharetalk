// ads.js - Fetch and display ads with optimized batch loading
document.addEventListener('DOMContentLoaded', async function() {
    const BACKEND_URL = 'https://musten-y.onrender.com';
    let GITHUB_CONFIG = null;
    
    // Optimized batch configuration
    const INITIAL_BATCH = 3; // Load first 3 immediately
    const BATCH_SIZE = 5;    // Subsequent batch size
    const BATCH_DELAY = 300; // Reduced to 300ms for faster loading
    
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
    
    // Create simple loading message
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'loading';
    loadingDiv.innerHTML = `
        <div style="color: chartreuse; font-size: 24px; font-weight: bold;">
            Loading ads, If it takes more than 1 minute to load ads please refresh the app...
        </div>
        <div style="color: white; margin-top: 10px; font-size: 14px;">
            First Ads loading...
        </div>
    `;
    loadingDiv.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        text-align: center;
        z-index: 1000;
        background: rgba(0, 0, 0, 0.9);
        padding: 40px;
        border-radius: 15px;
        border: 2px solid chartreuse;
    `;
    document.body.appendChild(loadingDiv);
    
    // Add minimal CSS
    const style = document.createElement('style');
    style.textContent = `
        .ad-card {
            background: rgba(0, 0, 0, 0.85);
            border: 2px solid white;
            border-radius: 15px;
            padding: 0;
            margin-bottom: 40px;
            max-width: 600px;
    margin-top: 30px;
            margin-left: auto;
            margin-right: auto;
            width: 100%;
            animation: fadeIn 0.3s ease-out;
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
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
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
        
        .batch-indicator {
            color: white;
            text-align: center;
            padding: 10px;
            font-size: 14px;
            opacity: 0.7;
        }
        
        @media (max-width: 768px) {
            .ad-card {
                margin: 0 10px 30px 10px;
            }
            
            .ad-image {
                height: 300px;
            }
        }
    `;
    document.head.appendChild(style);
    
    // Load credentials
    async function loadCredentials() {
        try {
            console.log('Loading credentials...');
            const response = await fetch(`${BACKEND_URL}/api/credentials`);
            if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
            
            const result = await response.json();
            if (result.success) {
                GITHUB_CONFIG = result.credentials;
                console.log(' credentials loaded');
                return true;
            }
            throw new Error(result.error);
        } catch (error) {
            console.error('❌ Failed to load credentials:', error);
            showMessage('Failed to connect to backend. Make sure server is running.', 'error');
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
    
    // Get ALL repositories (with proper pagination)
    async function getAllAdRepos() {
        try {
            console.log('Fetching all ads...');
            let allAdRepos = [];
            let page = 1;
            let totalPages = 0;
            const startTime = Date.now();
            
            // Fetch all pages until we get less than 100 repos
            while (true) {
                console.log(`📄 Fetching page ${page}...`);
                
                const response = await fetch(
                    `${GITHUB_CONFIG.apiBase}/user/repos?type=private&page=${page}&per_page=100`,
                    { headers: getGitHubHeaders() }
                );
                
                if (!response.ok) {
                    console.error(`API error: ${response.status}`);
                    break;
                }
                
                const repos = await response.json();
                
                // If no repos returned, we're done
                if (repos.length === 0) {
                    console.log('✅ No more ads found');
                    break;
                }
                
                // Filter for ad repos
                const adRepos = repos.filter(repo => 
                    repo.name.startsWith('ad-') && 
                    repo.private === true
                );
                
                console.log(`📦 Page ${page}: Found ${adRepos.length} ad repos (total: ${repos.length} repos)`);
                
                allAdRepos.push(...adRepos);
                totalPages = page;
                
                // If we got less than 100 repos, this is the last page
                if (repos.length < 100) {
                    console.log('✅ Last page reached');
                    break;
                }
                
                // Increment page for next fetch
                page++;
                
                // Safety limit: GitHub API allows up to 1000 repos (10 pages of 100)
                if (page > 10) {
                    console.log('⚠️ Safety limit reached: Stopped at 10 pages (1000 repos max)');
                    break;
                }
            }
            
            // Sort by update date (newest first)
            allAdRepos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            
            console.log(`✅ Total ad repos fetched: ${allAdRepos.length} (${Date.now() - startTime}ms)`);
            console.log(`📊 Pages fetched: ${totalPages}`);
            
            // Return initial batch and remaining repos
            return {
                initialBatch: allAdRepos.slice(0, INITIAL_BATCH),
                remainingRepos: allAdRepos.slice(INITIAL_BATCH)
            };
            
        } catch (error) {
            console.error('Error fetching repos:', error);
            return { initialBatch: [], remainingRepos: [] };
        }
    }
    
    // Process single ad repository (optimized)
    async function processAdRepo(repo) {
        try {
            const adNumber = repo.name.match(/ad-(\d+)/)?.[1] || '?';
            
            const adData = {
                repoName: repo.name,
                adNumber: adNumber,
                title: '',
                description: '',
                visitUrl: '',
                images: [],
                updatedAt: repo.updated_at
            };
            
            // Get repository contents
            const contentsResponse = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repo.name}/contents`,
                { headers: getGitHubHeaders() }
            );
            
            if (!contentsResponse.ok) {
                console.error(`Failed to get contents for ${repo.name}`);
                return null;
            }
            
            const contents = await contentsResponse.json();
            
            // Process files in parallel
            const filePromises = [];
            
            for (const item of contents) {
                if (item.type === 'file') {
                    if (item.name === 'title.txt') {
                        filePromises.push(getFileContent(repo.name, 'title.txt').then(content => {
                            adData.title = content;
                        }));
                    } else if (item.name === 'description.txt') {
                        filePromises.push(getFileContent(repo.name, 'description.txt').then(content => {
                            adData.description = content;
                        }));
                    } else if (item.name === 'visit.txt') {
                        filePromises.push(getFileContent(repo.name, 'visit.txt').then(content => {
                            adData.visitUrl = content;
                        }));
                    } else if (item.name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) {
                        filePromises.push(getImageAsDataUrl(repo.name, item.name).then(imageDataUrl => {
                            if (imageDataUrl) {
                                adData.images.push({
                                    name: item.name,
                                    dataUrl: imageDataUrl
                                });
                            }
                        }));
                    }
                }
            }
            
            // Wait for all file processing
            await Promise.all(filePromises);
            
            // Only return if we have required data
            if (adData.title && adData.description && adData.visitUrl) {
                console.log(`✅ Processed ad ${adNumber}`);
                return adData;
            }
            
            return null;
            
        } catch (error) {
            console.error(`Error processing ${repo.name}:`, error);
            return null;
        }
    }
    
    // Get file content
    async function getFileContent(repoName, fileName) {
        try {
            const response = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repoName}/contents/${fileName}`,
                { headers: getGitHubHeaders() }
            );
            
            if (!response.ok) return '';
            
            const fileData = await response.json();
            return atob(fileData.content);
            
        } catch (error) {
            console.error(`Error getting ${fileName}:`, error);
            return '';
        }
    }
    
    // Get image as data URL
    async function getImageAsDataUrl(repoName, fileName) {
        try {
            const response = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repoName}/contents/${fileName}`,
                { headers: getGitHubHeaders() }
            );
            
            if (!response.ok) {
                return null;
            }
            
            const fileData = await response.json();
            const base64Content = fileData.content;
            const mimeType = getMimeType(fileName);
            
            return `data:${mimeType};base64,${base64Content}`;
            
        } catch (error) {
            console.error(`Error getting image:`, error);
            return null;
        }
    }
    
    // Helper: get MIME type from filename
    function getMimeType(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const mimeTypes = {
            'jpg': 'image/jpeg',
            'jpeg': 'image/jpeg',
            'png': 'image/png',
            'gif': 'image/gif',
            'webp': 'image/webp',
            'svg': 'image/svg+xml',
            'bmp': 'image/bmp'
        };
        return mimeTypes[ext] || 'image/jpeg';
    }
    
    // Create and display ad card
    function createAdCard(adData) {
        const card = document.createElement('div');
        card.className = 'ad-card';
        
        // Header
        const header = document.createElement('div');
        header.style.cssText = `
            padding: 15px 20px;
            border-bottom: 1px solid rgba(255, 255, 255, 0.2);
            display: flex;
            justify-content: space-between;
            align-items: center;
        `;
        
        const title = document.createElement('h2');
        title.textContent = adData.title;
        title.style.cssText = `
            color: chartreuse;
            margin: 0;
            font-size: 20px;
            font-weight: bold;
        `;
        
        const badge = document.createElement('span');
        badge.textContent = ``;
        badge.style.cssText = `
            background: chartreuse;
            color: black;
            padding: 5px 12px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: bold;
        `;
        
        header.appendChild(title);
        header.appendChild(badge);
        card.appendChild(header);
        
        // Image section
        const imageSection = document.createElement('div');
        imageSection.style.cssText = `
            width: 100%;
            height: 400px;
            background: black;
        `;
        
        if (adData.images.length > 0) {
            const img = document.createElement('img');
            img.className = 'ad-image';
            img.src = adData.images[0].dataUrl;
            img.alt = adData.images[0].name;
            img.style.cssText = `
                width: 100%;
                height: 100%;
                object-fit: contain;
                display: block;
            `;
            imageSection.appendChild(img);
        } else {
            const noImage = document.createElement('div');
            noImage.className = 'no-image';
            noImage.innerHTML = `
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📷</div>
                    <div>No image available</div>
                </div>
            `;
            imageSection.appendChild(noImage);
        }
        
        card.appendChild(imageSection);
        
        // Description section
        const descSection = document.createElement('div');
        descSection.style.cssText = `
            padding: 20px;
        `;
        
        const description = document.createElement('p');
        description.textContent = adData.description;
        description.style.cssText = `
            color: white;
            margin: 0 0 20px 0;
            line-height: 1.5;
            font-size: 16px;
            white-space: pre-line;
        `;
        descSection.appendChild(description);
        
        // Visit button
        const visitBtn = document.createElement('button');
        visitBtn.textContent = 'VISIT WEBSITE';
        visitBtn.style.cssText = `
            background: chartreuse;
            color: black;
            border: none;
            padding: 12px 24px;
            border-radius: 25px;
            font-size: 16px;
            font-weight: bold;
            cursor: pointer;
            display: block;
            margin: 0 auto;
            width: 90%;
            max-width: 300px;
            transition: transform 0.2s;
        `;
        
        visitBtn.onmouseover = () => {
            visitBtn.style.transform = 'scale(1.05)';
        };
        
        visitBtn.onmouseout = () => {
            visitBtn.style.transform = 'scale(1)';
        };
        
        visitBtn.onclick = () => {
            window.open(adData.visitUrl, '_blank');
        };
        
        descSection.appendChild(visitBtn);
        card.appendChild(descSection);
        
        return card;
    }
    
    // Show message
    function showMessage(text, type = 'info') {
        loadingDiv.style.display = 'none';
        
        const msgDiv = document.createElement('div');
        msgDiv.style.cssText = `
            background: ${type === 'error' ? 'rgba(255, 0, 0, 0.1)' : 'rgba(0, 255, 0, 0.1)'};
            border: 1px solid ${type === 'error' ? 'red' : 'chartreuse'};
            border-radius: 10px;
            padding: 20px;
            margin: 20px;
            text-align: center;
            color: ${type === 'error' ? 'red' : 'chartreuse'};
        `;
        msgDiv.textContent = text;
        adsContainer.appendChild(msgDiv);
    }
    
    // Update loading message
    function updateLoadingMessage(message) {
        loadingDiv.innerHTML = `
            <div style="color: chartreuse; font-size: 24px; font-weight: bold;">
                Loading ads...
            </div>
            <div style="color: white; margin-top: 10px; font-size: 14px;">
                ${message}
            </div>
        `;
    }
    
    // Process and display a batch of ads
    async function processAndDisplayBatch(repos, batchNumber) {
        if (repos.length === 0) return [];
        
        console.log(`🔄 Processing batch ${batchNumber} (${repos.length} repos)`);
        
        // Process all repos in this batch in parallel
        const batchPromises = repos.map(repo => processAdRepo(repo));
        const batchResults = await Promise.all(batchPromises);
        
        // Filter valid ads and display them
        const validAds = batchResults.filter(ad => ad !== null);
        
        validAds.forEach(ad => {
            const card = createAdCard(ad);
            adsContainer.appendChild(card);
        });
        
        console.log(`✅ Batch ${batchNumber}: Displayed ${validAds.length} ads`);
        
        // Add batch indicator after first batch
        if (batchNumber > 1 && validAds.length > 0) {
            const indicator = document.createElement('div');
            indicator.className = 'batch-indicator';
            indicator.textContent = `Loaded ${validAds.length} more ads...`;
            adsContainer.appendChild(indicator);
            
            // Remove indicator after 1 second
            setTimeout(() => {
                if (indicator.parentNode) {
                    indicator.remove();
                }
            }, 1000);
        }
        
        return validAds;
    }
    
    // Main function to load and display ads with optimized batch loading
    async function loadAds() {
        console.log('🚀 Starting optimized ad loading...');
        
        // Reset
        adsContainer.innerHTML = '';
        loadingDiv.style.display = 'flex';
        updateLoadingMessage('Loading credentials...');
        
        try {
            // Load credentials
            if (!await loadCredentials()) {
                return;
            }
            
            updateLoadingMessage('Loading all ads...');
            
            // Get ALL ad repositories (with pagination)
            const { initialBatch, remainingRepos } = await getAllAdRepos();
            
            if (initialBatch.length === 0 && remainingRepos.length === 0) {
                showMessage('No ads found. Create your first ad!', 'info');
                return;
            }
            
            console.log(`📊 Total ads to process: ${initialBatch.length} initial + ${remainingRepos.length} remaining`);
            
            // Process and display initial batch immediately
            updateLoadingMessage('Processing first ads...');
            const initialAds = await processAndDisplayBatch(initialBatch, 1);
            
            // Hide loading after first batch is displayed
            if (initialAds.length > 0) {
                loadingDiv.style.display = 'none';
                console.log('📱 First batch displayed - loading indicator hidden');
            } else if (remainingRepos.length === 0) {
                showMessage('No valid ads found. Make sure each ad has title, description, and URL.', 'error');
                return;
            }
            
            // Process remaining repos in batches with minimal delay
            let batchIndex = 2;
            for (let i = 0; i < remainingRepos.length; i += BATCH_SIZE) {
                const batchRepos = remainingRepos.slice(i, i + BATCH_SIZE);
                
                // Wait a very short time between batches for smoother loading
                if (i > 0) {
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                }
                
                // Process and display this batch
                await processAndDisplayBatch(batchRepos, batchIndex);
                batchIndex++;
            }
            
            // Show completion message if we loaded many ads
            const totalAds = document.querySelectorAll('.ad-card').length;
            if (totalAds > 0) {
                const completionMsg = document.createElement('div');
                completionMsg.className = 'batch-indicator';
                completionMsg.style.cssText = `
                    color: chartreuse;
                    font-weight: bold;
                    padding: 15px;
                    margin-top: 10px;
                `;
                completionMsg.textContent = `✅ All ads loaded! Total: ${totalAds} ads`;
                adsContainer.appendChild(completionMsg);
                
                setTimeout(() => {
                    if (completionMsg.parentNode) {
                        completionMsg.remove();
                    }
                }, 3000);
            }
            
            console.log(`🎉 Completed! Total ads displayed: ${totalAds}`);
            
        } catch (error) {
            console.error('❌ Error loading ads:', error);
            showMessage('Error loading ads. Check console.', 'error');
        }
    }
    
    // Add refresh button
    const appBar = document.querySelector('.app-bar');
    if (appBar) {
        const refreshBtn = document.createElement('button');
        refreshBtn.innerHTML = '<i class="fa-solid fa-rotate-right"></i> Refresh';
        refreshBtn.style.cssText = `
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
            margin-left: auto;
            transition: all 0.3s;
        `;
        
        refreshBtn.onmouseover = () => {
            refreshBtn.style.background = 'chartreuse';
            refreshBtn.style.color = 'black';
            refreshBtn.style.borderColor = 'chartreuse';
        };
        
        refreshBtn.onmouseout = () => {
            refreshBtn.style.background = 'black';
            refreshBtn.style.color = 'white';
            refreshBtn.style.borderColor = 'white';
        };
        
        refreshBtn.onclick = () => {
            console.log('🔄 Manual refresh requested');
            loadAds();
        };
        
        appBar.appendChild(refreshBtn);
    }
    
    // Start loading
    loadAds();
});