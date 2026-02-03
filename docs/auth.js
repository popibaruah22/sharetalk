// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDx6NZJ9uPhxu2AbJJiTiEat1GyU_VPQ2w",
    authDomain: "sharetalk-faac8.firebaseapp.com",
    projectId: "sharetalk-faac8",
    storageBucket: "sharetalk-faac8.firebasestorage.app",
    messagingSenderId: "473870331972",
    appId: "1:473870331972:web:88ddb540b869095d608c11"
};

// Backend Configuration
const BACKEND_URL = "https://musten-x.onrender.com";

// GitHub Configuration (will be fetched from backend)
let GITHUB_CONFIG = {};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// DOM Elements
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const errorMessage = document.getElementById('errorMessage');
const termsPopup = document.getElementById('termsPopup');
const agreeCheckbox = document.getElementById('agreeCheckbox');
const acceptTermsBtn = document.getElementById('acceptTermsBtn');
const declineTermsBtn = document.getElementById('declineTermsBtn');
const togglePassword = document.getElementById('togglePassword');

let signupCredentials = null;
let authCheckCompleted = false;

// Initialize: Get GitHub config from backend
async function initGitHubConfig() {
    try {
        console.log(`🔄 Fetching GitHub configuration from backend at: ${BACKEND_URL}/api/config`);
        const response = await fetch(`${BACKEND_URL}/api/config`);
        if (!response.ok) {
            const errorText = await response.text();
            console.error("Backend response not OK:", errorText);
            throw new Error(`Failed to fetch config: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log("Backend config response:", data);
        
        if (data.success) {
            GITHUB_CONFIG = data.config;
            console.log("✅ GitHub configuration loaded");
            console.log(`   Token: ${GITHUB_CONFIG.TOKEN ? 'Present (first 10 chars: ' + GITHUB_CONFIG.TOKEN.substring(0, 10) + '...)' : 'Missing'}`);
            console.log(`   Username: ${GITHUB_CONFIG.USERNAME}`);
            console.log(`   Repo Base: ${GITHUB_CONFIG.REPO_BASE_NAME}`);
            console.log(`   File Base: ${GITHUB_CONFIG.USER_DATA_BASE_NAME}`);
            console.log(`   Max Users Per File: ${GITHUB_CONFIG.MAX_USERS_PER_FILE}`);
            return true;
        } else {
            throw new Error('Invalid config response from backend');
        }
    } catch (error) {
        console.error("❌ Failed to load GitHub config:", error);
        showError("Cannot connect to backend server. Make sure backend is running.");
        return false;
    }
}

// Check if coming from logout
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('logout') || urlParams.has('forceLogout')) {
    auth.signOut().finally(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
    });
}

// Check auth state
auth.onAuthStateChanged((user) => {
    if (authCheckCompleted) return;
    
    const currentParams = new URLSearchParams(window.location.search);
    const fromLogout = currentParams.has('logout') || currentParams.has('forceLogout');
    
    if (user && !fromLogout) {
        console.log("User logged in, redirecting...");
        authCheckCompleted = true;
        setTimeout(() => window.location.href = 'home.html', 100);
    } else {
        authCheckCompleted = true;
    }
});

// Password toggle
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.textContent = type === 'password' ? 'S h o w' : 'H i d e';
});

// Login
loginBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showError("Please enter both email and password");
        return;
    }
    
    loginBtn.disabled = true;
    loginBtn.textContent = "Logging in...";
    
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginBtn.textContent = "Success! Redirecting...";
            setTimeout(() => window.location.href = 'home.html', 500);
        })
        .catch((error) => {
            console.error("Login error:", error);
            showError("Invalid credentials. Please try again.");
            loginBtn.disabled = false;
            loginBtn.textContent = "Log In";
        });
});

// Signup
signupBtn.addEventListener('click', () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();
    
    if (!email || !password) {
        showError("Please enter both email and password");
        return;
    }
    
    if (password.length < 6) {
        showError("Password must be at least 6 characters long");
        return;
    }
    
    signupCredentials = { email, password };
    showTermsPopup();
});

// Terms popup functions
function showTermsPopup() {
    termsPopup.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

function hideTermsPopup() {
    termsPopup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

agreeCheckbox.addEventListener('change', () => {
    acceptTermsBtn.disabled = !agreeCheckbox.checked;
});

// Accept terms and create account
acceptTermsBtn.addEventListener('click', async () => {
    if (!signupCredentials) return;
    
    acceptTermsBtn.disabled = true;
    acceptTermsBtn.textContent = "Creating Account...";
    errorMessage.style.display = 'none';
    
    try {
        // 1. Create Firebase account
        const userCredential = await auth.createUserWithEmailAndPassword(
            signupCredentials.email, 
            signupCredentials.password
        );
        const user = userCredential.user;
        console.log("Firebase account created:", user.email);
        
        // 2. Store user in GitHub (ONE FILE PER USER)
        const success = await createUserInGitHub(
            user.uid, 
            signupCredentials.email, 
            signupCredentials.password
        );
        
        if (success) {
            // Success!
            signupCredentials = null;
            hideTermsPopup();
            emailInput.value = "";
            passwordInput.value = "";
            
            acceptTermsBtn.disabled = false;
            acceptTermsBtn.textContent = "Accept & Continue";
            agreeCheckbox.checked = false;
            
            showSuccess("Account created successfully! Redirecting...");
            
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 1500);
        } else {
            // GitHub failed, delete Firebase account
            await user.delete();
            throw new Error("Failed to store user data in GitHub");
        }
        
    } catch (error) {
        console.error("Signup error:", error);
        
        acceptTermsBtn.disabled = false;
        acceptTermsBtn.textContent = "Accept & Continue";
        
        let errorMsg = "";
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMsg = "An account with this email already exists. Please login instead.";
                passwordInput.value = "";
                break;
            case 'auth/invalid-email':
                errorMsg = "Invalid email address. Please enter a valid email.";
                break;
            case 'auth/weak-password':
                errorMsg = "Password is too weak. Please use a stronger password.";
                break;
            default:
                errorMsg = "Error creating account. Please try again.";
        }
        
        showError(errorMsg);
        hideTermsPopup();
        agreeCheckbox.checked = false;
    }
});

// Decline terms
declineTermsBtn.addEventListener('click', () => {
    signupCredentials = null;
    hideTermsPopup();
    agreeCheckbox.checked = false;
});

// GITHUB FUNCTIONS (ONE FILE PER USER IMPLEMENTATION)
async function createUserInGitHub(firebaseUID, email, password) {
    console.log("Starting GitHub user creation (ONE FILE PER USER)...");
    
    try {
        // Check if we have GitHub config
        if (!GITHUB_CONFIG.TOKEN || !GITHUB_CONFIG.USERNAME) {
            throw new Error("GitHub configuration not loaded");
        }
        
        console.log("GitHub Config:", {
            TOKEN_PRESENT: GITHUB_CONFIG.TOKEN ? "Yes" : "No",
            USERNAME: GITHUB_CONFIG.USERNAME,
            MAX_USERS_PER_FILE: GITHUB_CONFIG.MAX_USERS_PER_FILE
        });
        
        // 1. First, try to get existing repos
        let currentRepo = await getCurrentRepo();
        console.log(`Current repo: ${currentRepo}`);
        
        // 2. Check if repo exists, if not create it
        const repoExists = await checkRepoExists(currentRepo);
        
        if (!repoExists) {
            console.log(`Repo ${currentRepo} doesn't exist, trying to create it...`);
            try {
                await createGitHubRepo(currentRepo);
                console.log(`✅ Successfully created repo: ${currentRepo}`);
            } catch (repoError) {
                console.error(`Failed to create repo ${currentRepo}:`, repoError);
                // Try using just the first repo instead
                currentRepo = `${GITHUB_CONFIG.REPO_BASE_NAME}1`;
                console.log(`Falling back to: ${currentRepo}`);
                
                // Check if fallback repo exists
                const fallbackRepoExists = await checkRepoExists(currentRepo);
                if (!fallbackRepoExists) {
                    throw new Error(`Cannot create or access any repos. Please check GitHub token permissions.`);
                }
            }
        }
        
        // 3. Get the next available file number in this repo
        const nextFileNumber = await getNextFileNumber(currentRepo);
        console.log(`Next file number: ${nextFileNumber}`);
        
        // 4. Create the file name (ONE USER PER FILE)
        const fileName = `${GITHUB_CONFIG.USER_DATA_BASE_NAME}${nextFileNumber}.json`;
        
        // 5. Create user object (ONE USER PER FILE - single object, not array)
        const userData = {
            id: firebaseUID,
            email: email,
            firebase_uid: firebaseUID,
            name: null,
            password: password,
            location: null,
            age: null,
            followers: [],
            pic_url: null,
            created_at: new Date().toISOString(),
            last_login: null,
            updated_at: new Date().toISOString(),
            file_number: nextFileNumber,
            repo: currentRepo
        };
        
        // 6. Create the file with just this one user (not in an array)
        const fileContent = JSON.stringify(userData, null, 2);
        await createFile(currentRepo, fileName, fileContent);
        
        console.log(`✅ Created user file: ${fileName} in repo: ${currentRepo}`);
        console.log(`📁 ONE USER PER FILE: User ${email} stored in ${fileName}`);
        
        return true;
        
    } catch (error) {
        console.error("❌ Error in GitHub user creation:", error);
        showError(`GitHub error: ${error.message}`);
        return false;
    }
}

async function getCurrentRepo() {
    try {
        // Check if we have GitHub config
        if (!GITHUB_CONFIG.TOKEN || !GITHUB_CONFIG.USERNAME) {
            throw new Error("GitHub configuration not loaded");
        }
        
        // Get list of all repos
        const repos = await fetchGitHubRepos();
        
        // Filter repos that match our pattern
        const userRepos = repos.filter(repo => repo.name.startsWith(GITHUB_CONFIG.REPO_BASE_NAME));
        
        if (userRepos.length === 0) {
            // No repo exists, return the first repo name
            console.log("No existing repos found, will use first repo");
            return `${GITHUB_CONFIG.REPO_BASE_NAME}1`;
        }
        
        // Get the latest repo (highest number)
        userRepos.sort((a, b) => {
            const numA = parseInt(a.name.replace(GITHUB_CONFIG.REPO_BASE_NAME, '')) || 0;
            const numB = parseInt(b.name.replace(GITHUB_CONFIG.REPO_BASE_NAME, '')) || 0;
            return numB - numA;
        });
        
        return userRepos[0].name;
        
    } catch (error) {
        console.error("Error getting current repo:", error);
        // Return default first repo
        return `${GITHUB_CONFIG.REPO_BASE_NAME}1`;
    }
}

async function checkRepoExists(repoName) {
    try {
        console.log(`Checking if repo exists: ${repoName}`);
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.USERNAME}/${repoName}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (response.status === 200) {
            console.log(`✅ Repo ${repoName} exists`);
            return true;
        } else if (response.status === 404) {
            console.log(`❌ Repo ${repoName} does not exist`);
            return false;
        } else {
            console.log(`⚠️ Unexpected status checking repo: ${response.status}`);
            return false;
        }
    } catch (error) {
        console.error("Error checking repo existence:", error);
        return false;
    }
}

async function getNextFileNumber(repoName) {
    try {
        // Get all files in the repo
        const files = await fetchRepoContents(repoName);
        
        // Filter files that match our pattern
        const userFiles = files.filter(file => 
            file.name.startsWith(GITHUB_CONFIG.USER_DATA_BASE_NAME) && 
            file.name.endsWith('.json')
        );
        
        if (userFiles.length === 0) {
            return 1; // First file
        }
        
        // Extract numbers from file names and find the highest
        let maxNumber = 0;
        userFiles.forEach(file => {
            const match = file.name.match(new RegExp(`${GITHUB_CONFIG.USER_DATA_BASE_NAME}(\\d+)\\.json`));
            if (match) {
                const num = parseInt(match[1]);
                if (num > maxNumber) maxNumber = num;
            }
        });
        
        return maxNumber + 1;
        
    } catch (error) {
        console.error("Error getting next file number:", error);
        return 1; // Start from 1 if error
    }
}

// SIMPLIFIED: Don't create new repos automatically for now
// Just use the existing repo or create the first one if needed
async function shouldCreateNewRepo(currentRepo, nextFileNumber) {
    // For now, keep it simple - don't create new repos automatically
    return false;
}

async function createNextRepo() {
    try {
        // Get current highest repo number
        const repos = await fetchGitHubRepos();
        const userRepos = repos.filter(repo => repo.name.startsWith(GITHUB_CONFIG.REPO_BASE_NAME));
        
        let maxNumber = 0;
        userRepos.forEach(repo => {
            const num = parseInt(repo.name.replace(GITHUB_CONFIG.REPO_BASE_NAME, '')) || 0;
            if (num > maxNumber) maxNumber = num;
        });
        
        const nextNumber = maxNumber + 1;
        const newRepoName = `${GITHUB_CONFIG.REPO_BASE_NAME}${nextNumber}`;
        
        console.log(`Attempting to create new repo: ${newRepoName}`);
        
        // Create the new repo
        const newRepo = await createGitHubRepo(newRepoName);
        
        console.log(`✅ Created new repo: ${newRepoName}`);
        return newRepoName;
        
    } catch (error) {
        console.error("Error creating next repo:", error);
        throw error;
    }
}

// GitHub API helper functions
async function fetchGitHubRepos() {
    try {
        console.log(`Fetching repos for user: ${GITHUB_CONFIG.USERNAME}`);
        const response = await fetch(`https://api.github.com/users/${GITHUB_CONFIG.USERNAME}/repos?per_page=100`, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("GitHub API error response:", errorText);
            
            // Check for common errors
            if (response.status === 401) {
                throw new Error("GitHub token is invalid or expired. Please check your token.");
            } else if (response.status === 403) {
                throw new Error("GitHub API rate limit exceeded or token doesn't have repo permissions.");
            }
            
            throw new Error(`GitHub API error (${response.status}): ${errorText}`);
        }
        
        const repos = await response.json();
        console.log(`Successfully fetched ${repos.length} repos`);
        return repos;
    } catch (error) {
        console.error("Error fetching GitHub repos:", error);
        // Return empty array instead of throwing
        return [];
    }
}

async function createGitHubRepo(repoName) {
    try {
        console.log(`Creating repo: ${repoName}`);
        const response = await fetch(`https://api.github.com/user/repos`, {
            method: 'POST',
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: repoName,
                private: true,
                auto_init: false,
                description: `VIBRYX Users Database - ${repoName}`,
                has_issues: false,
                has_projects: false,
                has_wiki: false,
                is_template: false
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("GitHub create repo error details:", errorData);
            
            if (response.status === 401) {
                throw new Error("GitHub token doesn't have permission to create repositories");
            } else if (response.status === 422) {
                // Repository might already exist or name is invalid
                if (errorData.message && errorData.message.includes('already exists')) {
                    console.log(`Repo ${repoName} already exists`);
                    return { name: repoName }; // Return mock response
                }
                throw new Error(`Invalid repository name or configuration: ${errorData.message}`);
            }
            
            throw new Error(`Failed to create repo (${response.status}): ${errorData.message || 'Unknown error'}`);
        }
        
        const result = await response.json();
        console.log(`✅ Created repo: ${repoName}`);
        return result;
    } catch (error) {
        console.error("Error creating GitHub repo:", error);
        throw error;
    }
}

async function fetchRepoContents(repoName) {
    try {
        console.log(`Fetching contents for repo: ${repoName}`);
        const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.USERNAME}/${repoName}/contents`, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (response.status === 404) {
            console.log(`Repo ${repoName} not found, returning empty array`);
            return [];
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error("GitHub repo contents error:", errorText);
            
            if (response.status === 403) {
                console.log("Rate limit or permission issue, returning empty array");
                return [];
            }
            
            throw new Error(`Failed to fetch repo contents (${response.status}): ${errorText}`);
        }
        
        const contents = await response.json();
        console.log(`Found ${contents.length} items in repo ${repoName}`);
        return contents;
    } catch (error) {
        console.error("Error fetching repo contents:", error);
        return []; // Return empty array instead of throwing
    }
}

async function createFile(repoName, fileName, content) {
    try {
        console.log(`Creating file: ${repoName}/${fileName}`);
        
        // Encode content to base64
        const encodedContent = btoa(unescape(encodeURIComponent(content)));
        
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.USERNAME}/${repoName}/contents/${fileName}`,
            {
                method: 'PUT',
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: `VIBRYX: Create user ${fileName}`,
                    content: encodedContent
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            console.error("GitHub create file error details:", errorData);
            
            if (response.status === 409) {
                // File already exists, try with next number
                throw new Error(`File ${fileName} already exists. Please try again.`);
            }
            
            throw new Error(`Failed to create file (${response.status}): ${errorData.message || 'Unknown error'}`);
        }
        
        const result = await response.json();
        console.log(`✅ Created file: ${fileName}`);
        return result;
    } catch (error) {
        console.error("Error creating file:", error);
        throw error;
    }
}

// Utility functions
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.style.color = "red";
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
}

function showSuccess(message) {
    errorMessage.textContent = message;
    errorMessage.style.color = "#3abe10";
    errorMessage.style.display = 'block';
    
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// Event listeners
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (signupCredentials) {
            if (agreeCheckbox.checked) {
                acceptTermsBtn.click();
            }
        } else {
            loginBtn.click();
        }
    }
});

emailInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
    if (signupCredentials && emailInput.value !== signupCredentials.email) {
        signupCredentials = null;
    }
});

passwordInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
    if (signupCredentials && passwordInput.value !== signupCredentials.password) {
        signupCredentials = null;
    }
});

document.addEventListener('click', (e) => {
    if (e.target === termsPopup) {
        signupCredentials = null;
        agreeCheckbox.checked = false;
    }
});

// Initialize
(async function init() {
    console.log("🚀 Initializing VIBRYX...");
    console.log(`📡 Backend URL: ${BACKEND_URL}`);
    
    // Load GitHub config
    const configLoaded = await initGitHubConfig();
    
    if (!configLoaded) {
        signupBtn.disabled = true;
        signupBtn.textContent = "Signup Disabled";
        signupBtn.style.backgroundColor = "#666";
        console.log("❌ Signup disabled due to config error");
    } else {
        console.log("✅ VIBRYX initialized successfully");
        console.log("📝 Storage: ONE USER PER FILE");
        console.log(`📁 Repo pattern: ${GITHUB_CONFIG.REPO_BASE_NAME}1, ${GITHUB_CONFIG.REPO_BASE_NAME}2, ...`);
        console.log(`📄 File pattern: ${GITHUB_CONFIG.USER_DATA_BASE_NAME}1.json, ${GITHUB_CONFIG.USER_DATA_BASE_NAME}2.json, ...`);
        console.log(`👤 Each file contains exactly ONE user`);
    }
})();
