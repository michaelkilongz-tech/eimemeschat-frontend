// Authentication Module
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authListeners = [];
        
        // Check if Firebase is loaded
        if (!window.firebaseAuth) {
            console.error('Firebase not loaded');
            return;
        }
        
        this.init();
    }
    
    init() {
        // Listen for auth state changes
        firebaseAuth.onAuthStateChanged((user) => {
            this.handleAuthStateChange(user);
        });
        
        // Setup form switches
        this.setupFormSwitches();
    }
    
    setupFormSwitches() {
        // Show password toggle
        document.querySelectorAll('.show-password').forEach(button => {
            button.addEventListener('click', function() {
                const input = this.parentElement.querySelector('input');
                const icon = this.querySelector('i');
                
                if (input.type === 'password') {
                    input.type = 'text';
                    icon.className = 'fas fa-eye-slash';
                } else {
                    input.type = 'password';
                    icon.className = 'fas fa-eye';
                }
            });
        });
        
        // Switch between login and register forms
        document.getElementById('showRegister')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showRegisterForm();
        });
        
        document.getElementById('showLogin')?.addEventListener('click', (e) => {
            e.preventDefault();
            this.showLoginForm();
        });
        
        // Login button
        document.getElementById('loginBtn')?.addEventListener('click', () => {
            window.app?.handleLogin?.() || this.handleLogin();
        });
        
        // Register button
        document.getElementById('registerBtn')?.addEventListener('click', () => {
            window.app?.handleRegister?.() || this.handleRegister();
        });
        
        // Google login
        document.getElementById('googleLoginBtn')?.addEventListener('click', () => {
            this.handleGoogleLogin();
        });
        
        // Enter key support
        document.getElementById('loginPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.app?.handleLogin?.() || this.handleLogin();
            }
        });
        
        document.getElementById('confirmPassword')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                window.app?.handleRegister?.() || this.handleRegister();
            }
        });
    }
    
    showLoginForm() {
        document.getElementById('loginForm').classList.add('active');
        document.getElementById('registerForm').classList.remove('active');
    }
    
    showRegisterForm() {
        document.getElementById('registerForm').classList.add('active');
        document.getElementById('loginForm').classList.remove('active');
    }
    
    handleAuthStateChange(user) {
        this.currentUser = user;
        
        if (user) {
            console.log('User signed in:', user.email);
            this.updateUserProfile(user);
            this.notifyListeners('login', user);
        } else {
            console.log('User signed out');
            this.notifyListeners('logout');
        }
    }
    
    async handleLogin() {
        const email = document.getElementById('loginEmail').value.trim();
        const password = document.getElementById('loginPassword').value.trim();
        
        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }
        
        try {
            const result = await firebaseAuth.signInWithEmailAndPassword(email, password);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Login error:', error);
            const message = this.getErrorMessage(error);
            this.showToast(message, 'error');
            return { success: false, error: message };
        }
    }
    
    async handleRegister() {
        const name = document.getElementById('registerName').value.trim();
        const email = document.getElementById('registerEmail').value.trim();
        const password = document.getElementById('registerPassword').value.trim();
        const confirmPassword = document.getElementById('confirmPassword').value.trim();
        const agreeTerms = document.getElementById('agreeTerms').checked;
        
        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showToast('Please fill in all fields', 'error');
            return { success: false, error: 'Please fill in all fields' };
        }
        
        if (password.length < 8) {
            this.showToast('Password must be at least 8 characters', 'error');
            return { success: false, error: 'Password must be at least 8 characters' };
        }
        
        if (password !== confirmPassword) {
            this.showToast('Passwords do not match', 'error');
            return { success: false, error: 'Passwords do not match' };
        }
        
        if (!agreeTerms) {
            this.showToast('Please agree to the terms and conditions', 'error');
            return { success: false, error: 'Please agree to the terms and conditions' };
        }
        
        try {
            // Create user
            const result = await firebaseAuth.createUserWithEmailAndPassword(email, password);
            
            // Update profile
            await result.user.updateProfile({
                displayName: name
            });
            
            // Send email verification
            await result.user.sendEmailVerification();
            
            this.showToast('Account created successfully! Please check your email for verification.', 'success');
            return { success: true, user: result.user };
            
        } catch (error) {
            console.error('Registration error:', error);
            const message = this.getErrorMessage(error);
            this.showToast(message, 'error');
            return { success: false, error: message };
        }
    }
    
    async handleGoogleLogin() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('profile');
            provider.addScope('email');
            
            const result = await firebaseAuth.signInWithPopup(provider);
            return { success: true, user: result.user };
        } catch (error) {
            console.error('Google login error:', error);
            const message = this.getErrorMessage(error);
            this.showToast(message, 'error');
            return { success: false, error: message };
        }
    }
    
    async logout() {
        try {
            await firebaseAuth.signOut();
            return { success: true };
        } catch (error) {
            console.error('Logout error:', error);
            return { success: false, error: error.message };
        }
    }
    
    async updateUserProfile(user) {
        // This method can be expanded to update user data in your backend
        console.log('Updating user profile:', user.uid);
    }
    
    async resetPassword(email) {
        try {
            await firebaseAuth.sendPasswordResetEmail(email);
            return { success: true };
        } catch (error) {
            return { success: false, error: this.getErrorMessage(error) };
        }
    }
    
    getErrorMessage(error) {
        switch(error.code) {
            case 'auth/invalid-email':
                return 'Invalid email address';
            case 'auth/user-disabled':
                return 'This account has been disabled';
            case 'auth/user-not-found':
                return 'No account found with this email';
            case 'auth/wrong-password':
                return 'Incorrect password';
            case 'auth/email-already-in-use':
                return 'Email already in use';
            case 'auth/weak-password':
                return 'Password should be at least 8 characters';
            case 'auth/operation-not-allowed':
                return 'Email/password accounts are not enabled';
            case 'auth/network-request-failed':
                return 'Network error. Please check your connection';
            case 'auth/popup-closed-by-user':
                return 'Login popup was closed';
            case 'auth/cancelled-popup-request':
                return 'Popup request cancelled';
            case 'auth/popup-blocked':
                return 'Popup was blocked by your browser';
            default:
                return error.message || 'An error occurred';
        }
    }
    
    addListener(callback) {
        this.authListeners.push(callback);
    }
    
    notifyListeners(event, data) {
        this.authListeners.forEach(callback => {
            callback(event, data);
        });
    }
    
    getCurrentUser() {
        return this.currentUser;
    }
    
    isAuthenticated() {
        return this.currentUser !== null;
    }
    
    showToast(message, type = 'info') {
        // Use app's toast if available
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
            return;
        }
        
        // Fallback toast
        const toast = document.createElement('div');
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10a37f' : '#3b82f6'};
            color: white;
            border-radius: 8px;
            z-index: 1000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
}

// Initialize Auth Manager
window.authManager = new AuthManager();