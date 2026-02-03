// ads.js - Fetch and display ads with batch loading
document.addEventListener('DOMContentLoaded', async function() {
    const BACKEND_URL = 'https://musten-y.onrender.com';
    let GITHUB_CONFIG = null;
    
    // Batch configuration
    const BATCH_SIZE = 5;
    const BATCH_DELAY = 1000; // 1 second between batches
    
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
            Loading ads... This may take a moment please refresh the app if it takes more than 1 minute...
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
            margin-left: auto;
            margin-right: auto;
            width: 100%;
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
                console.log('✅ GitHub credentials loaded');
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
    
    // Get ALL repositories (simplified)
    async function getAllAdRepos() {
        try {
            console.log('Fetching repositories...');
            let allRepos = [];
            let page = 1;
            
            while (true) {
                const response = await fetch(
                    `${GITHUB_CONFIG.apiBase}/user/repos?type=private&page=${page}&per_page=100`,
                    { headers: getGitHubHeaders() }
                );
                
                if (!response.ok) throw new Error(`GitHub API error: ${response.status}`);
                
                const repos = await response.json();
                if (repos.length === 0) break;
                
                // Filter for ad repos
                const adRepos = repos.filter(repo => 
                    repo.name.startsWith('ad-') && 
                    repo.private === true
                );
                
                allRepos.push(...adRepos);
                
                // If we got less than 100, we're done
                if (repos.length < 100) break;
                
                page++;
                if (page > 10) break; // Safety limit
            }
            
            console.log(`Found ${allRepos.length} ad repositories`);
            return allRepos;
            
        } catch (error) {
            console.error('Error fetching repos:', error);
            return [];
        }
    }
    
    // Get file content
    async function getFileContent(repoName, fileName) {
        try {
            const response = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repoName}/contents/${fileName}`,
                { headers: getGitHubHeaders() }
            );
            
            if (!response.ok) return null;
            
            const fileData = await response.json();
            return atob(fileData.content);
            
        } catch (error) {
            console.error(`Error getting ${fileName}:`, error);
            return null;
        }
    }
    
    // Get image as data URL (guaranteed to work for private repos)
    async function getImageAsDataUrl(repoName, fileName) {
        try {
            console.log(`Getting image: ${repoName}/${fileName}`);
            
            // Get the file from GitHub API
            const response = await fetch(
                `${GITHUB_CONFIG.apiBase}/repos/${GITHUB_CONFIG.username}/${repoName}/contents/${fileName}`,
                { headers: getGitHubHeaders() }
            );
            
            if (!response.ok) {
                console.error(`Failed to get image info: ${response.status}`);
                return null;
            }
            
            const fileData = await response.json();
            
            // Decode base64 content
            const base64Content = fileData.content;
            const mimeType = getMimeType(fileName);
            
            // Create data URL
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
    
    // Process single ad repository
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
            
            // Process files
            for (const item of contents) {
                if (item.type === 'file') {
                    if (item.name === 'title.txt') {
                        adData.title = await getFileContent(repo.name, 'title.txt');
                    } else if (item.name === 'description.txt') {
                        adData.description = await getFileContent(repo.name, 'description.txt');
                    } else if (item.name === 'visit.txt') {
                        adData.visitUrl = await getFileContent(repo.name, 'visit.txt');
                    } else if (item.name.match(/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i)) {
                        // Get image as data URL (guaranteed to work)
                        const imageDataUrl = await getImageAsDataUrl(repo.name, item.name);
                        if (imageDataUrl) {
                            adData.images.push({
                                name: item.name,
                                dataUrl: imageDataUrl
                            });
                        }
                    }
                }
            }
            
            // Only return if we have required data
            if (adData.title && adData.description && adData.visitUrl) {
                console.log(`✅ Processed ad ${adNumber}: ${adData.title}`);
                return adData;
            }
            
            return null;
            
        } catch (error) {
            console.error(`Error processing ${repo.name}:`, error);
            return null;
        }
    }
    
    // Create and display ad card
    function createAdCard(adData) {
        // Create card container
        const card = document.createElement('div');
        card.className = 'ad-card';
        
        // Header with title and ad number
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
            position: relative;
        `;
        
        if (adData.images.length > 0) {
            // Use the first image
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
    
    // Main function to load and display ads with batch loading
    async function loadAds() {
        console.log('🚀 Starting ad loading with batch processing...');
        
        // Reset
        adsContainer.innerHTML = '';
        loadingDiv.style.display = 'flex';
        
        try {
            // Load credentials
            if (!await loadCredentials()) {
                return;
            }
            
            // Get all ad repositories
            const repos = await getAllAdRepos();
            
            if (repos.length === 0) {
                showMessage('No ads found. Create your first ad!', 'info');
                return;
            }
            
            // Sort by update date (newest first)
            repos.sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at));
            
            // Variables for batch loading
            let allProcessedAds = [];
            
            // Process and display in batches
            for (let i = 0; i < repos.length; i += BATCH_SIZE) {
                const batchRepos = repos.slice(i, i + BATCH_SIZE);
                const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
                
                console.log(`🔄 Processing batch ${batchNumber} (repos ${i + 1}-${Math.min(i + BATCH_SIZE, repos.length)})`);
                
                // Process current batch
                const batchPromises = batchRepos.map(repo => processAdRepo(repo));
                const batchResults = await Promise.all(batchPromises);
                
                // Filter valid ads
                const validBatchAds = batchResults.filter(ad => ad !== null);
                
                // Add to collection
                allProcessedAds.push(...validBatchAds);
                
                // Display this batch's ads
                if (validBatchAds.length > 0) {
                    validBatchAds.forEach(ad => {
                        const card = createAdCard(ad);
                        adsContainer.appendChild(card);
                    });
                    
                    console.log(`✅ Batch ${batchNumber}: Displayed ${validBatchAds.length} ads`);
                    
                    // Hide loading after first batch
                    if (i === 0) {
                        loadingDiv.style.display = 'none';
                        console.log('📱 First batch displayed - loading indicator hidden');
                    }
                }
                
                // Wait 1 second before next batch (except after last batch)
                if (i + BATCH_SIZE < repos.length) {
                    console.log(`⏳ Waiting ${BATCH_DELAY}ms before next batch...`);
                    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY));
                }
            }
            
            // Final summary
            console.log(`🎉 Completed! Total ads displayed: ${allProcessedAds.length}`);
            
            if (allProcessedAds.length === 0) {
                showMessage('No valid ads found. Make sure each ad has title, description, and URL.', 'error');
            }
            
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