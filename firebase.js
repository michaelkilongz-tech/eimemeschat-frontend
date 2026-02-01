<script type="module">
  // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.8.0/firebase-analytics.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>