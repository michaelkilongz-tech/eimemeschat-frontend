// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyCEmylMsBhUPZRbWaj6CcKzD8b5bIY9MK4",
    authDomain: "eimemeschat.firebaseapp.com",
    projectId: "eimemeschat",
    storageBucket: "eimemeschat.firebasestorage.app",
    messagingSenderId: "224221400348",
    appId: "1:224221400348:web:45fcb162c3cb5e02f2fed9",
    measurementId: "G-7FC8HN4R7D"
    
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
} else {
    firebase.app(); // if already initialized, use that one
}

// Services
window.firebaseAuth = firebase.auth();