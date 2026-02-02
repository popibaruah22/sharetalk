
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
        if (!response.ok) throw new Error(`Failed to fetch config: ${response.status}`);
        
        const data = await response.json();
        if (data.success) {
            GITHUB_CONFIG = data.config;
            console.log("✅ GitHub configuration loaded");
            console.log(`   Username: ${GITHUB_CONFIG.USERNAME}`);
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
        
        // 2. Store user in GitHub
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

// GITHUB FUNCTIONS (All logic in frontend)
async function createUserInGitHub(firebaseUID, email, password) {
    console.log("Starting GitHub user creation...");
    
    try {
        // Check if we have GitHub config
        if (!GITHUB_CONFIG.TOKEN || !GITHUB_CONFIG.USERNAME) {
            throw new Error("GitHub configuration not loaded");
        }
        
        // 1. Get current repo and file
        const currentRepoInfo = await getCurrentRepoAndFile();
        const currentRepoName = currentRepoInfo.name;
        const currentFileName = currentRepoInfo.currentFile;
        
        console.log(`Using repo: ${currentRepoName}, file: ${currentFileName}`);
        
        // 2. Get current file content
        const currentFileContent = await getFileContent(currentRepoName, currentFileName);
        let usersArray = [];
        
        if (currentFileContent) {
            usersArray = JSON.parse(currentFileContent.content);
        }
        
        // 3. Create new user object
        const newUser = {
            email: email,
            firebase_uid: firebaseUID,
            name: null,
            password: password,
            followers: [],
            pic_url: null,
            created_at: new Date().toISOString(),
            last_login: null
        };
        
        // 4. Add new user to array
        usersArray.push(newUser);
        const newContent = JSON.stringify(usersArray, null, 2);
        
        // 5. Check if file will exceed size limit
        const newFileSize = new Blob([newContent]).size;
        const newFileSizeMB = newFileSize / (1024 * 1024);
        
        if (newFileSizeMB >= GITHUB_CONFIG.MAX_FILE_SIZE_MB) {
            console.log(`File will exceed ${GITHUB_CONFIG.MAX_FILE_SIZE_MB}MB, creating new file`);
            const nextFileNumber = parseInt(currentFileName.match(/\d+/)[0]) + 1;
            const nextFileName = `${GITHUB_CONFIG.USER_DATA_BASE_NAME}${nextFileNumber}.json`;
            const nextFileContent = JSON.stringify([newUser], null, 2);
            
            await createFile(currentRepoName, nextFileName, nextFileContent);
            console.log(`Created new file: ${nextFileName}`);
        } else {
            await updateFile(currentRepoName, currentFileName, newContent, currentFileContent?.sha);
            console.log(`Updated existing file: ${currentFileName}`);
        }
        
        console.log("✅ User successfully stored in GitHub");
        return true;
        
    } catch (error) {
        console.error("❌ Error in GitHub user creation:", error);
        showError(`GitHub error: ${error.message}`);
        return false;
    }
}

async function getCurrentRepoAndFile() {
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
            // No repo exists, create the first one
            console.log("No existing repo found, creating first repo");
            const newRepo = await createGitHubRepo(`${GITHUB_CONFIG.REPO_BASE_NAME}1`);
            return {
                name: newRepo.name,
                currentFile: `${GITHUB_CONFIG.USER_DATA_BASE_NAME}1.json`
            };
        }
        
        // Get the latest repo (highest number)
        userRepos.sort((a, b) => {
            const numA = parseInt(a.name.replace(GITHUB_CONFIG.REPO_BASE_NAME, '')) || 0;
            const numB = parseInt(b.name.replace(GITHUB_CONFIG.REPO_BASE_NAME, '')) || 0;
            return numB - numA;
        });
        
        const latestRepo = userRepos[0];
        
        // Get files in this repo
        const files = await fetchRepoContents(latestRepo.name);
        
        // Filter JSON files that match our pattern
        const userFiles = files.filter(file => 
            file.name.startsWith(GITHUB_CONFIG.USER_DATA_BASE_NAME) && 
            file.name.endsWith('.json')
        );
        
        if (userFiles.length === 0) {
            return {
                name: latestRepo.name,
                currentFile: `${GITHUB_CONFIG.USER_DATA_BASE_NAME}1.json`
            };
        }
        
        // Get the latest file (highest number)
        userFiles.sort((a, b) => {
            const numA = parseInt(a.name.match(/\d+/)[0]) || 0;
            const numB = parseInt(b.name.match(/\d+/)[0]) || 0;
            return numB - numA;
        });
        
        return {
            name: latestRepo.name,
            currentFile: userFiles[0].name
        };
        
    } catch (error) {
        console.error("Error getting current repo:", error);
        // Return default first repo/file
        return {
            name: `${GITHUB_CONFIG.REPO_BASE_NAME}1`,
            currentFile: `${GITHUB_CONFIG.USER_DATA_BASE_NAME}1.json`
        };
    }
}

// GitHub API helper functions
async function fetchGitHubRepos() {
    try {
        const response = await fetch(`https://api.github.com/users/${GITHUB_CONFIG.USERNAME}/repos`, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`GitHub API error (${response.status}): ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error fetching GitHub repos:", error);
        throw error;
    }
}

async function createGitHubRepo(repoName) {
    try {
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
                description: `VIBRYX Users Database - ${repoName}`
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to create repo: ${errorData.message || JSON.stringify(errorData)}`);
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
        const response = await fetch(`https://api.github.com/repos/${GITHUB_CONFIG.USERNAME}/${repoName}/contents`, {
            headers: {
                'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch repo contents (${response.status}): ${errorText}`);
        }
        
        return await response.json();
    } catch (error) {
        console.error("Error fetching repo contents:", error);
        throw error;
    }
}

async function getFileContent(repoName, fileName) {
    try {
        const response = await fetch(
            `https://api.github.com/repos/${GITHUB_CONFIG.USERNAME}/${repoName}/contents/${fileName}`,
            {
                headers: {
                    'Authorization': `token ${GITHUB_CONFIG.TOKEN}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            }
        );
        
        if (response.status === 404) {
            return null; // File doesn't exist
        }
        
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch file (${response.status}): ${errorText}`);
        }
        
        const data = await response.json();
        const content = atob(data.content.replace(/\n/g, ''));
        return {
            content: content,
            sha: data.sha
        };
    } catch (error) {
        console.error("Error getting file content:", error);
        throw error;
    }
}

async function createFile(repoName, fileName, content) {
    try {
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
                    message: `VIBRYX: Create ${fileName}`,
                    content: btoa(unescape(encodeURIComponent(content)))
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to create file: ${errorData.message || JSON.stringify(errorData)}`);
        }
        
        console.log(`✅ Created file: ${fileName}`);
        return await response.json();
    } catch (error) {
        console.error("Error creating file:", error);
        throw error;
    }
}

async function updateFile(repoName, fileName, content, sha) {
    try {
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
                    message: `VIBRYX: Update ${fileName}`,
                    content: btoa(unescape(encodeURIComponent(content))),
                    sha: sha
                })
            }
        );
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Failed to update file: ${errorData.message || JSON.stringify(errorData)}`);
        }
        
        console.log(`✅ Updated file: ${fileName}`);
        return await response.json();
    } catch (error) {
        console.error("Error updating file:", error);
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
    }
})();
