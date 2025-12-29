self.addEventListener("install", () => {
  console.log("✅ Service Worker Installed");
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("✅ Service Worker Activated");
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow("/") // opens your app when user taps notification
  );
});
