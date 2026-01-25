// src/firebase.js - UPDATED WITH GOOGLE AUTH
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {
  getAuth,
  signInAnonymously,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCR2x3NW_W1djiGsFHbQbUCKDJSNQTsq64",
  authDomain: "andromeda-78f0b.firebaseapp.com",
  projectId: "andromeda-78f0b",
  storageBucket: "andromeda-78f0b.firebasestorage.app",
  messagingSenderId: "261564773538",
  appId: "1:261564773538:web:bcefb3ddb197e3bf8713fb",
  measurementId: "G-2CPML7PX9R",
};

console.log("🔄 Initializing Firebase with Google Auth...");

// Initialize Firebase
const app = initializeApp(firebaseConfig);
console.log("✅ Firebase app initialized");

const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Create Google Auth Provider
const googleProvider = new GoogleAuthProvider();
// Always show account selector
googleProvider.setCustomParameters({
  prompt: "select_account",
});

console.log("✅ Firebase services loaded");
console.log("🔌 Firestore instance:", db ? "Created" : "Failed");

export {
  app,
  analytics,
  auth,
  signInAnonymously,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
};
