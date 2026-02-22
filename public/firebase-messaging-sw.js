// public/andromeda/firebase-messaging-sw.js
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js",
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.8.0/firebase-messaging-compat.js",
);

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCR2x3NW_W1djiGsFHbQbUCKDJSNQTsq64",
  authDomain: "andromeda-78f0b.firebaseapp.com",
  projectId: "andromeda-78f0b",
  storageBucket: "andromeda-78f0b.firebasestorage.app",
  messagingSenderId: "261564773538",
  appId: "1:261564773538:web:bcefb3ddb197e3bf8713fb",
  measurementId: "G-2CPML7PX9R",
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Messaging
const messaging = firebase.messaging();

// ============================================
// FETCH HANDLER - Keeps service worker alive
// ============================================
self.addEventListener("fetch", (event) => {
  // This minimal fetch handler prevents the browser from
  // killing the service worker when idle
  // We just pass through all requests to the network
  event.respondWith(fetch(event.request));
});

// ============================================
// PUSH EVENT - Direct handler for push messages
// ============================================
self.addEventListener("push", (event) => {
  console.log("[firebase-messaging-sw.js] Push event received:", event);

  if (!event.data) {
    console.log("Push event but no data");
    return;
  }

  try {
    const data = event.data.json();
    console.log("Push event data:", data);

    const title =
      data.notification?.title || data.data?.title || "🔔 Calendar Reminder";
    const options = {
      body:
        data.notification?.body ||
        data.data?.body ||
        "You have an upcoming event",
      icon: "/andromeda/android-icon-192x192.png",
      badge: "/andromeda/android-icon-192x192.png",
      data: data.data || {},
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: "view",
          title: "👁️ View Calendar",
        },
        {
          action: "dismiss",
          title: "❌ Dismiss",
        },
      ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
  } catch (e) {
    console.error("Error parsing push event data:", e);
  }
});

// ============================================
// BACKGROUND MESSAGE HANDLER - Firebase specific
// ============================================
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Background message received:",
    payload,
  );

  // Extract notification data
  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    "🔔 Calendar Reminder";

  const notificationBody =
    payload.notification?.body ||
    payload.data?.body ||
    "You have an upcoming event";

  const notificationData = payload.data || {};

  // Notification options
  const notificationOptions = {
    body: notificationBody,
    icon: "/andromeda/android-icon-192x192.png",
    badge: "/andromeda/android-icon-192x192.png",
    tag: notificationData.eventId || "calendar-notification",
    data: notificationData,
    requireInteraction: true,
    vibrate: [200, 100, 200],
    actions: [
      {
        action: "view",
        title: "👁️ View Calendar",
      },
      {
        action: "dismiss",
        title: "❌ Dismiss",
      },
    ],
  };

  // Show notification
  return self.registration.showNotification(
    notificationTitle,
    notificationOptions,
  );
});

// ============================================
// NOTIFICATION CLICK HANDLER
// ============================================
self.addEventListener("notificationclick", (event) => {
  console.log(
    "[firebase-messaging-sw.js] Notification clicked:",
    event.notification.tag,
  );

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  // Determine URL to open - use the data from notification if available
  const urlToOpen = event.notification.data?.url || "/andromeda/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        // Check if there's already a window open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        // If not, open a new window
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});

// ============================================
// INSTALL HANDLER - Force activation
// ============================================
self.addEventListener("install", (event) => {
  console.log("[firebase-messaging-sw.js] Installing...");
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// ============================================
// ACTIVATE HANDLER - Take control immediately
// ============================================
self.addEventListener("activate", (event) => {
  console.log("[firebase-messaging-sw.js] Activating...");
  // Take control of all clients (tabs) immediately
  event.waitUntil(clients.claim());
});

// ============================================
// MESSAGE HANDLER - For communication from pages
// ============================================
self.addEventListener("message", (event) => {
  console.log("[firebase-messaging-sw.js] Message received:", event.data);

  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

console.log("[firebase-messaging-sw.js] Service worker loaded and ready");
