// Login.jsx - UPDATED WITH GOOGLE AUTH
import { useState, useEffect } from "react";
import {
  auth,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
} from "./firebase";

function Login() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Check auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);

      if (currentUser) {
        console.log("✅ User signed in:", currentUser.email);
        // Redirect to notes page after successful login
        window.location.href = "/andromeda/notes";
      }
    });

    return () => unsubscribe();
  }, []);

  const handleGoogleSignIn = async () => {
    try {
      console.log("🔐 Attempting Google sign-in...");
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      console.log("✅ Google sign-in successful!");
      console.log("📧 Email:", user.email);
      console.log("👤 Name:", user.displayName);
      console.log("🆔 UID:", user.uid);

      // Store user info
      localStorage.setItem("userEmail", user.email);
      localStorage.setItem("userName", user.displayName || "User");
      localStorage.setItem("userId", user.uid);

      // The useEffect will handle the redirect
    } catch (error) {
      console.error("❌ Google sign-in failed:", error);

      if (error.code === "auth/popup-blocked") {
        alert("Please allow popups for Google sign-in");
      } else if (error.code === "auth/popup-closed-by-user") {
        console.log("User closed the sign-in popup");
      } else {
        alert(`Sign-in failed: ${error.message}`);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      localStorage.removeItem("userEmail");
      localStorage.removeItem("userName");
      localStorage.removeItem("userId");
      setUser(null);
      console.log("✅ Signed out successfully");
    } catch (error) {
      console.error("❌ Sign out failed:", error);
    }
  };

  // Show loading state
  if (loading) {
    return (
      <div className="login-container">
        <div className="login-page-brand-name">
          <h1>Andromeda.</h1>
          <div>
            <i className="fa-solid fa-flask"></i> iINTUIT Labs.
          </div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  // If user is already signed in, show different UI
  if (user) {
    return (
      <div className="login-container">
        <div className="login-page-brand-name">
          <h1>Andromeda.</h1>
          <div>
            <i className="fa-solid fa-flask"></i> iINTUIT Labs.
          </div>

          <div className="welcome-message">
            <p>Welcome back, {user.displayName || user.email}!</p>
            <p>Redirecting to Notes...</p>
          </div>

          <div className="google-login-button">
            <button className="login-button" onClick={handleSignOut}>
              <img
                src="./google.png"
                style={{ height: "30px", width: "30px" }}
                alt="Google"
              />{" "}
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show login screen
  return (
    <div className="login-container">
      <div className="login-page-brand-name">
        <h1>Andromeda.</h1>
        <div>
          <i className="fa-solid fa-flask"></i> iINTUIT Labs.
        </div>

        <div className="welcome-message">
          <p>Sign in to sync your data across devices</p>
        </div>

        <div className="google-login-button">
          <button className="login-button" onClick={handleGoogleSignIn}>
            <img
              src="./google.png"
              style={{ height: "30px", width: "30px" }}
              alt="Google"
            />{" "}
            Sign in with Google
          </button>
        </div>

        <div className="guest-option" style={{ marginTop: "20px" }}>
          <p style={{ fontSize: "14px", color: "#666" }}>
            Or continue as{" "}
            <a
              href="/andromeda/notes"
              style={{ color: "#4285f4", textDecoration: "none" }}
            >
              Guest
            </a>{" "}
            (data saved locally)
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;
