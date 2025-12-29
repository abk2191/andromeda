import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";

if ("serviceWorker" in navigator) {
  window.addEventListener("load", async () => {
    try {
      const reg = await navigator.serviceWorker.register("./sw.js");

      console.log("✅ Service Worker Registered:", reg);
      window.__SW_REG = reg; // store globally for notifications
    } catch (err) {
      console.error("❌ Service Worker registration failed:", err);
    }
  });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />
  </StrictMode>
);
