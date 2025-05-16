import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCJ4zMigJKDA_dYTTlRSj4zZPfbuHXc5ys",
  authDomain: "triad-of-angels.firebaseapp.com", // Revert to Firebase Hosting domain
  projectId: "triad-of-angels",
  storageBucket: "triad-of-angels.firebasestorage.app",
  messagingSenderId: "436114961244",
  appId: "1:436114961244:web:c88e75d225c1bc1217c799",
  measurementId: "G-EJ5X7FN10H"
};

// Initialize Firebase (only once)
let app;
try {
  app = initializeApp(firebaseConfig);
} catch (error) {
  if (error.code !== 'app/duplicate-app') {
    console.error('Error initializing Firebase:', error);
  }
  app = firebase.app(); // Use existing app if already initialized
}

// Initialize Auth and Firestore
const auth = getAuth(app);
const db = getFirestore(app);

// Export the initialized instances
export { app, auth, db };