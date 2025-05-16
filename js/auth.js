// Triad of Angels - Firebase Auth Setup (Global Site-Wide)
// auth.js

import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app, auth, db } from './firebase-init.js';

(function () {
  try {
    console.log('auth.js: Initializing...');

    const authUI = document.getElementById("global-auth-ui");
    const loginBtn = document.getElementById("global-login-btn");
    const logoutBtn = document.getElementById("global-logout-btn");
    const userName = document.getElementById("global-user-name");

    if (!authUI || !loginBtn || !logoutBtn || !userName) {
      console.error('Critical auth elements missing. Authentication UI will not function.');
      return;
    }

    const provider = new GoogleAuthProvider();

    function showErrorToast(message) {
      const toast = document.getElementById('global-error-toast');
      if (toast) {
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
          toast.style.display = 'none';
        }, 3000);
      }
    }

    onAuthStateChanged(auth, async (user) => {
      console.log('onAuthStateChanged fired:', user ? `Logged in as ${user.displayName}` : 'No user');
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        let userData = {};
        try {
          const userDoc = await getDoc(userDocRef);
          userData = userDoc.exists() ? userDoc.data() : {};
        } catch (error) {
          console.warn('Could not fetch user data:', error);
        }

        const display = userData.username || user.displayName || user.email || 'User';
        userName.textContent = display;
        loginBtn.style.display = 'none';
        logoutBtn.style.display = 'inline-block';
        authUI.style.display = 'inline-flex';
      } else {
        userName.textContent = 'Guest';
        loginBtn.style.display = 'inline-block';
        logoutBtn.style.display = 'none';
        authUI.style.display = 'inline-flex';
      }
    });

    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        try {
          const result = await signInWithPopup(auth, provider);
          const user = result.user;
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (!userDoc.exists()) {
            await setDoc(userDocRef, {
              displayName: user.displayName,
              email: user.email,
              subscribedToNewsletter: false,
              createdAt: new Date().toISOString()
            }, { merge: true });
          }
        } catch (err) {
          console.error("Login error:", err.message);
          showErrorToast('Failed to sign in. Please check your connection and try again.');
        }
      });
    }

    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        try {
          await signOut(auth);
          console.log("User signed out");
        } catch (err) {
          console.error("Logout error:", err.message);
          showErrorToast('Failed to sign out. Please try again.');
        }
      });
    }

  } catch (error) {
    console.error('Error initializing auth.js:', error);
  }
})();
