// main.jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

console.log("🚀 App starting...");

// Define base path - must match your vite.config.js
const basePath = "/andromeda/";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    // Construct the correct URL with base path
    const swUrl = `${window.location.origin}${basePath}firebase-messaging-sw.js`;

    console.log("📱 Registering service worker at:", swUrl);

    navigator.serviceWorker
      .register(swUrl, { scope: basePath })
      .then((registration) => {
        console.log(
          "✅ Service Worker registered with scope:",
          registration.scope,
        );
      })
      .catch((error) => {
        console.error("❌ Service Worker registration failed:", error);
      });
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
