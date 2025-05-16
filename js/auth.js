// Triad of Angels - Firebase Auth Setup (Global Site-Wide)

import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { doc, setDoc, getDoc, collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { app, auth, db } from './firebase-init.js';

(function () {
  try {
    console.log('auth.js: Initializing...');

    // Elements
    const authUI = document.getElementById("global-auth-ui");
    const loginBtn = document.getElementById("global-login-btn");
    const logoutBtn = document.getElementById("global-logout-btn");
    const userName = document.getElementById("global-user-name");

    // Username Modal Elements
    const usernameModal = document.createElement('div');
    usernameModal.id = 'username-modal';
    usernameModal.className = 'username-modal';
    usernameModal.setAttribute('role', 'dialog');
    usernameModal.setAttribute('aria-label', 'Set username');
    usernameModal.innerHTML = `
      <div class="username-modal-content">
        <h3>Set Your Username</h3>
        <p>Choose a unique username for commenting and display across the site.</p>
        <input type="text" id="username-input" placeholder="Enter username" aria-label="Username input">
        <p id="username-error" class="username-error"></p>
        <div class="username-modal-buttons">
          <button id="username-submit">Save Username</button>
          <button id="username-cancel">Cancel</button>
        </div>
      </div>
    `;
    document.body.appendChild(usernameModal);

    const usernameInput = document.getElementById('username-input');
    const usernameSubmit = document.getElementById('username-submit');
    const usernameError = document.getElementById('username-error');
    const usernameCancel = document.getElementById('username-cancel');

    // Debugging: Check elements
    if (!authUI) console.error("Auth UI element not found. Check ID: global-auth-ui");
    if (!loginBtn) console.error("Login button not found. Check ID: global-login-btn");
    if (!logoutBtn) console.error("Logout button not found. Check ID: global-logout-btn");
    if (!userName) console.error("User name element not found. Check ID: global-user-name");
    if (!usernameInput || !usernameSubmit || !usernameError || !usernameCancel) console.error("Username modal elements missing");

    // Exit if critical elements are missing
    if (!authUI || !loginBtn || !logoutBtn || !userName) {
      console.error('Critical auth elements missing. Authentication UI will not function.');
      showErrorToast('Authentication UI failed to load. Please refresh the page.');
      return;
    }

    // Initialize GoogleAuthProvider
    const provider = new GoogleAuthProvider();

    // Show error toast
    function showErrorToast(message) {
      const toast = document.getElementById('global-error-toast');
      if (toast) {
        toast.textContent = message;
        toast.style.display = 'block';
        setTimeout(() => {
          toast.style.display = 'none';
        }, 3000);
      } else {
        console.warn('Error toast element not found. Check ID: global-error-toast');
      }
    }

    // Username Validation
    async function isUsernameTaken(username) {
      try {
        const q = query(collection(db, 'users'), where('username', '==', username));
        const querySnapshot = await getDocs(q);
        const taken = !querySnapshot.empty;
        console.log(`Username "${username}" is ${taken ? 'taken' : 'available'}`);
        return taken;
      } catch (error) {
        console.error('Error checking if username is taken:', error);
        showErrorToast('Failed to check username availability.');
        return false; // Assume not taken if Firestore fails
      }
    }

    async function setUsername(user, username) {
      if (!username || username.length < 3 || username.length > 20) {
        usernameError.textContent = 'Username must be 3-20 characters.';
        usernameError.style.display = 'block';
        return false;
      }
      if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
        usernameError.textContent = 'Username can only contain letters, numbers, underscores, and hyphens.';
        usernameError.style.display = 'block';
        return false;
      }
      if (await isUsernameTaken(username)) {
        usernameError.textContent = 'Username is already taken.';
        usernameError.style.display = 'block';
        return false;
      }
      try {
        await setDoc(doc(db, 'users', user.uid), { username }, { merge: true });
        console.log(`Username "${username}" successfully saved for user ${user.uid}`);
        return true;
      } catch (error) {
        console.error('Error saving username to Firestore:', error);
        usernameError.textContent = 'Failed to save username. Please try again.';
        usernameError.style.display = 'block';
        showErrorToast('Failed to save username. Check your connection.');
        return false;
      }
    }

    // Fetch user data from Firestore with retry mechanism
    async function fetchUserDataWithRetry(user, retries = 3, delay = 1000) {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log(`Firestore fetch successful (attempt ${attempt}) for UID ${user.uid}:`, userData);
            return userData;
          } else {
            console.log(`No Firestore document found for UID ${user.uid} (attempt ${attempt})`);
            return { username: null }; // Return explicit null username
          }
        } catch (error) {
          console.error(`Error fetching user data from Firestore (attempt ${attempt}):`, error);
          if (attempt === retries) {
            console.warn('Max retries reached, returning fallback data');
            showErrorToast('Failed to fetch user data. Please try again.');
            return { username: null }; // Fallback to null username
          }
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Show Username Modal
    function showUsernameModal(user) {
      console.log('Showing username modal for user:', user.uid);
      usernameModal.classList.add('active');
      usernameInput.value = '';
      usernameError.style.display = 'none';
      usernameInput.focus(); // Auto-focus input

      // Focus trap
      const focusableElements = usernameModal.querySelectorAll('button, input');
      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];

      function trapFocus(e) {
        if (e.key === 'Tab') {
          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }

      usernameModal.addEventListener('keydown', trapFocus);

      usernameSubmit.onclick = async () => {
        const username = usernameInput.value.trim();
        if (await setUsername(user, username)) {
          localStorage.removeItem('authState');
          usernameModal.classList.remove('active');
          usernameModal.removeEventListener('keydown', trapFocus);
          const userData = {
            displayName: user.displayName,
            email: user.email,
            uid: user.uid,
            username
          };
          localStorage.setItem('authState', JSON.stringify(userData));
          userName.textContent = username || user.displayName || user.email || 'User';
        }
      };
      usernameCancel.onclick = () => {
        console.log('Username modal closed via Cancel button');
        usernameModal.classList.remove('active');
        usernameModal.removeEventListener('keydown', trapFocus);
      };
    }

    // Keyboard Accessibility for Modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && usernameModal.classList.contains('active')) {
        console.log('Username modal closed via Escape key');
        usernameModal.classList.remove('active');
      }
    });

    // Load cached auth state from localStorage
    let cachedAuth = localStorage.getItem('authState');
    let initialUser = null;
    if (cachedAuth) {
      try {
        initialUser = JSON.parse(cachedAuth);
        console.log('Initial cached auth state from localStorage:', initialUser);
      } catch (e) {
        console.warn('Invalid cached auth state:', e);
        localStorage.removeItem('authState');
        cachedAuth = null;
      }
    }

    // Render UI immediately based on cached state
    if (initialUser) {
      userName.textContent = initialUser.username || initialUser.displayName || initialUser.email || 'User';
      loginBtn.style.display = 'none';
      logoutBtn.style.display = 'inline-block';
      authUI.style.display = 'inline-flex';
    } else {
      userName.textContent = 'Guest';
      loginBtn.style.display = 'inline-block';
      logoutBtn.style.display = 'none';
      authUI.style.display = 'inline-flex';
    }

    // Session Status
    onAuthStateChanged(auth, async (user) => {
      console.log('onAuthStateChanged fired:', user ? `Logged in as ${user.displayName} (UID: ${user.uid})` : 'No user');
      if (user) {
        // Fetch user data from Firestore as the primary source of truth
        let userData = await fetchUserDataWithRetry(user);
        console.log('Fetched user data:', userData);

        // Ensure userData has a username field, even if null
        if (!userData || typeof userData.username === 'undefined') {
          userData = { username: null };
        }

        // Update cache and UI only if different from cached state
        const updatedData = {
          displayName: user.displayName,
          email: user.email,
          uid: user.uid,
          username: userData.username || null
        };
        const cachedData = JSON.parse(localStorage.getItem('authState') || '{}');
        if (JSON.stringify(updatedData) !== JSON.stringify(cachedData)) {
          localStorage.setItem('authState', JSON.stringify(updatedData));
          userName.textContent = userData.username || user.displayName || user.email || 'User';
          loginBtn.style.display = 'none';
          logoutBtn.style.display = 'inline-block';
          authUI.style.display = 'inline-flex';
        }

        // Check if username exists in Firestore
        if (!userData.username) {
          console.log(`No username found for UID ${user.uid}, showing modal`);
          showUsernameModal(user);
        } else {
          console.log(`Username found in Firestore: ${userData.username}, skipping modal`);
        }
      } else {
        // Clear cache and update UI only if different from cached state
        const cachedData = JSON.parse(localStorage.getItem('authState') || '{}');
        if (cachedData.uid) {
          localStorage.removeItem('authState');
          userName.textContent = 'Guest';
          loginBtn.style.display = 'inline-block';
          logoutBtn.style.display = 'none';
          authUI.style.display = 'inline-flex';
        }
      }
    });

    // Login
    if (loginBtn) {
      loginBtn.addEventListener("click", async () => {
        console.log("Login button clicked");
        try {
          const result = await signInWithPopup(auth, provider);
          const user = result.user;
          console.log("User logged in:", user.displayName);
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

    // Logout
    if (logoutBtn) {
      logoutBtn.addEventListener("click", async () => {
        console.log("Logout button clicked");
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
    showErrorToast('Authentication system failed to initialize.');
  }
})();