// public/firebase-messaging-sw.js
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

// Handle background messages
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
    //badge: "/badge-72x72.png",
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

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log(
    "[firebase-messaging-sw.js] Notification clicked:",
    event.notification.tag,
  );

  event.notification.close();

  if (event.action === "dismiss") {
    return;
  }

  const urlToOpen = "/";

  event.waitUntil(
    clients
      .matchAll({ type: "window", includeUncontrolled: true })
      .then((clientList) => {
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      }),
  );
});
