// Your Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyDx6NZJ9uPhxu2AbJJiTiEat1GyU_VPQ2w",
    authDomain: "sharetalk-faac8.firebaseapp.com",
    projectId: "sharetalk-faac8",
    storageBucket: "sharetalk-faac8.firebasestorage.app",
    messagingSenderId: "473870331972",
    appId: "1:473870331972:web:88ddb540b869095d608c11"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

// Set auth persistence to LOCAL (remembers across sessions)
// Remove or change this line to use LOCAL persistence instead of SESSION
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
    .then(() => {
        console.log("Auth persistence set to LOCAL");
    })
    .catch((error) => {
        console.error("Error setting persistence:", error);
    });

// DOM Elements
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const signupBtn = document.getElementById('signupBtn');
const authForm = document.getElementById('authForm');
const errorMessage = document.getElementById('errorMessage');
const termsPopup = document.getElementById('termsPopup');
const agreeCheckbox = document.getElementById('agreeCheckbox');
const acceptTermsBtn = document.getElementById('acceptTermsBtn');
const declineTermsBtn = document.getElementById('declineTermsBtn');
const togglePassword = document.getElementById('togglePassword');

let signupCredentials = null;
let authCheckCompleted = false;

// Check if coming from logout
const urlParams = new URLSearchParams(window.location.search);
const hasLogoutParam = urlParams.has('logout');
const hasForceLogoutParam = urlParams.has('forceLogout');

// If coming from logout, clear everything
if (hasLogoutParam || hasForceLogoutParam) {
    // Clear Firebase auth
    auth.signOut().then(() => {
        console.log("Logged out due to logout parameter");
        // Clear URL parameters without page reload
        window.history.replaceState({}, document.title, window.location.pathname);
        // Don't redirect, stay on login page
    }).catch(() => {
        window.history.replaceState({}, document.title, window.location.pathname);
    });
}

// Check if user is already logged in - IMPROVED
auth.onAuthStateChanged((user) => {
    // Prevent multiple redirects
    if (authCheckCompleted) return;
    
    // Get current URL parameters
    const currentParams = new URLSearchParams(window.location.search);
    const fromLogout = currentParams.has('logout');
    const fromForceLogout = currentParams.has('forceLogout');
    
    // If user exists AND not coming from logout
    if (user && !fromLogout && !fromForceLogout) {
        console.log("User is logged in:", user.email);
        console.log("Redirecting to home.html");
        
        // Set flag to prevent multiple checks
        authCheckCompleted = true;
        
        // Small delay to ensure DOM is ready
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 100);
    } else {
        // User is not logged in or coming from logout
        console.log("User not logged in, staying on login page");
        authCheckCompleted = true;
    }
});

// Password visibility toggle
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    // Change eye icon
    this.textContent = type === 'password' ? 'S h o w' : 'H i d e';
});

// Login Function
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
        .then((userCredential) => {
            // Login successful
            loginBtn.textContent = "Success! Redirecting...";
            console.log("Login successful, redirecting to home");
            
            // Clear form
            emailInput.value = "";
            passwordInput.value = "";
            
            // Redirect to home page
            setTimeout(() => {
                window.location.href = 'home.html';
            }, 500);
        })
        .catch((error) => {
            // Handle errors
            console.error("Login error:", error);
            showError("Invalid credentials. Please try again.");
            loginBtn.disabled = false;
            loginBtn.textContent = "Log In";
        });
});

// Signup Function
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
    
    // Store credentials and show terms popup
    signupCredentials = { email, password };
    showTermsPopup();
});

// Show Terms Popup
function showTermsPopup() {
    termsPopup.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Hide Terms Popup
function hideTermsPopup() {
    termsPopup.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Enable/disable accept button based on checkbox
agreeCheckbox.addEventListener('change', () => {
    acceptTermsBtn.disabled = !agreeCheckbox.checked;
});

// Accept Terms and Create Account
acceptTermsBtn.addEventListener('click', () => {
    if (!signupCredentials) return;
    
    acceptTermsBtn.disabled = true;
    acceptTermsBtn.textContent = "Creating Account...";
    
    // Reset any previous states
    errorMessage.style.display = 'none';
    
    auth.createUserWithEmailAndPassword(
        signupCredentials.email, 
        signupCredentials.password
    )
    .then((userCredential) => {
        // Account created successfully
        const user = userCredential.user;
        console.log("Account created:", user.email);
        
        // Clear signup credentials
        signupCredentials = null;
        
        // Hide popup
        hideTermsPopup();
        
        // Clear form
        emailInput.value = "";
        passwordInput.value = "";
        passwordInput.type = "password";
        togglePassword.textContent = "Show";
        
        // Reset accept button
        acceptTermsBtn.disabled = false;
        acceptTermsBtn.textContent = "Accept & Continue";
        agreeCheckbox.checked = false;
        
        // Show success message
        showSuccess("Account created successfully! Redirecting...");
        
        // Wait a moment then redirect
        setTimeout(() => {
            window.location.href = 'home.html';
        }, 1500);
    })
    .catch((error) => {
        console.error("Signup error:", error);
        
        // Reset button state
        acceptTermsBtn.disabled = false;
        acceptTermsBtn.textContent = "Accept & Continue";
        
        // Show error with specific message
        let errorMsg = "";
        switch (error.code) {
            case 'auth/email-already-in-use':
                errorMsg = "An account with this email already exists. Please login instead.";
                // Clear password for security
                passwordInput.value = "";
                passwordInput.type = "password";
                togglePassword.textContent = "Show";
                break;
            case 'auth/invalid-email':
                errorMsg = "Invalid email address. Please enter a valid email.";
                break;
            case 'auth/weak-password':
                errorMsg = "Password is too weak. Please use a stronger password (at least 6 characters).";
                break;
            case 'auth/operation-not-allowed':
                errorMsg = "Email/password accounts are not enabled. Please contact support.";
                break;
            default:
                errorMsg = "Error creating account. Please try again.";
        }
        
        // Show the error message
        showError(errorMsg);
        
        // Hide popup
        hideTermsPopup();
        
        // Reset checkbox
        agreeCheckbox.checked = false;
    });
});

// Decline Terms
declineTermsBtn.addEventListener('click', () => {
    signupCredentials = null;
    hideTermsPopup();
    agreeCheckbox.checked = false;
});

// Show error message
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    
    // Style for different error types
    if (message.includes("already exists")) {
        errorMessage.style.color = "#FFA500";
        errorMessage.style.fontWeight = "bold";
    } else {
        errorMessage.style.color = "red";
    }
    
    // Hide error after 5 seconds
    setTimeout(() => {
        errorMessage.style.display = 'none';
        errorMessage.style.color = "red";
    }, 5000);
}

// Show success message
function showSuccess(message) {
    errorMessage.textContent = message;
    errorMessage.style.color = "#3abe10";
    errorMessage.style.fontWeight = "bold";
    errorMessage.style.display = 'block';
    
    // Hide after 3 seconds (will be redirected before this)
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 3000);
}

// Prevent form submission
authForm.addEventListener('submit', (e) => {
    e.preventDefault();
});

// Handle Enter key
passwordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        if (signupCredentials) {
            // If in signup flow, trigger accept terms if checkbox is checked
            if (agreeCheckbox.checked) {
                acceptTermsBtn.click();
            }
        } else {
            loginBtn.click();
        }
    }
});

// Clear error when user starts typing
emailInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
    // Clear signup credentials if user edits email
    if (signupCredentials && emailInput.value !== signupCredentials.email) {
        signupCredentials = null;
    }
});

passwordInput.addEventListener('input', () => {
    errorMessage.style.display = 'none';
    // Clear signup credentials if user edits password
    if (signupCredentials && passwordInput.value !== signupCredentials.password) {
        signupCredentials = null;
    }
});

// Also clear signup credentials when terms popup is closed
document.addEventListener('click', (e) => {
    if (e.target === termsPopup) {
        signupCredentials = null;
        agreeCheckbox.checked = false;
    }
});
