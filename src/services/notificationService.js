// src/services/notificationService.js
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { db, auth } from "../firebase.js";
import {
  doc,
  setDoc,
  collection,
  deleteDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";

// Your VAPID key from Firebase Console
const VAPID_KEY =
  "BJX394ZmLSR1x0DOBgEUdQDt7k1CWBXuj43waPiibdLCGQ-1CsC3nzq_ky30fDoHdL5n0s020ClKepxgGcDONt8";

class NotificationService {
  constructor() {
    this.messaging = null;
    this.currentToken = null;
    this.messageListener = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the notification service
   */
  async initialize() {
    if (this.isInitialized) {
      console.log("📱 Notification service already initialized");
      return true;
    }

    try {
      console.log("📱 Initializing notification service...");

      // Check if browser supports notifications
      if (!("Notification" in window)) {
        console.log("📱 This browser does not support notifications");
        return false;
      }

      // Get messaging instance
      this.messaging = getMessaging();

      // Set up foreground message handler
      this.setupForegroundHandler();

      this.isInitialized = true;
      console.log("✅ Notification service initialized");

      return true;
    } catch (error) {
      console.error("❌ Failed to initialize notification service:", error);
      return false;
    }
  }

  /**
   * Request notification permission and get FCM token
   */
  async requestPermission() {
    try {
      console.log("📱 Requesting notification permission...");

      // Check if already granted
      if (Notification.permission === "granted") {
        console.log("📱 Notification permission already granted");
        return await this.getToken();
      }

      // Request permission
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        console.log("✅ Notification permission granted");
        return await this.getToken();
      } else if (permission === "denied") {
        console.log("❌ Notification permission denied");
        return null;
      } else {
        console.log("📱 Notification permission dismissed");
        return null;
      }
    } catch (error) {
      console.error("❌ Error requesting notification permission:", error);
      return null;
    }
  }

  /**
   * Get FCM token
   */
  async getToken() {
    try {
      if (!this.messaging) {
        this.messaging = getMessaging();
      }

      // Try to get the service worker registration
      let registration = null;
      if ("serviceWorker" in navigator) {
        registration =
          await navigator.serviceWorker.getRegistration("/andromeda/");
      }

      const currentToken = await getToken(this.messaging, {
        vapidKey: VAPID_KEY,
        serviceWorkerRegistration: registration, // Pass the registration
      });

      if (currentToken) {
        this.currentToken = currentToken;
        console.log(
          "✅ FCM token obtained:",
          currentToken.substring(0, 20) + "...",
        );

        // Save token to Firestore
        await this.saveTokenToServer(currentToken);

        return currentToken;
      } else {
        console.log("📱 No registration token available");
        return null;
      }
    } catch (error) {
      console.error("❌ Error getting FCM token:", error);
      return null;
    }
  }

  /**
   * Save FCM token to Firestore
   */
  async saveTokenToServer(token) {
    const user = auth.currentUser;
    if (!user) {
      console.log("📱 No user signed in, skipping token save");
      return;
    }

    try {
      // Get device ID and type
      const deviceId = this.getDeviceId();
      const deviceType = this.getDeviceType();

      const tokenRef = doc(db, "users", user.uid, "fcmTokens", token);
      await setDoc(tokenRef, {
        token,
        userId: user.uid,
        userEmail: user.email,
        userAgent: navigator.userAgent,
        platform: deviceType, // 👈 FIXED: Use actual device type
        deviceId: deviceId, // 👈 Add device ID here too
        createdAt: new Date().toISOString(),
        lastUsed: new Date().toISOString(),
      });
      console.log(
        `✅ FCM token saved to Firestore with platform: ${deviceType}`,
      );
    } catch (error) {
      console.error("❌ Error saving FCM token:", error);
    }
  }

  /**
   * Set up foreground message handler
   */
  setupForegroundHandler() {
    if (!this.messaging) {
      this.messaging = getMessaging();
    }

    // Remove any existing listener
    if (this.messageListener) {
      this.messageListener();
    }

    // Set up new listener
    this.messageListener = onMessage(this.messaging, (payload) => {
      console.log("📱 Foreground message received:", payload);

      // Show in-app notification
      this.showInAppNotification(payload);

      // Also show browser notification if permitted
      if (Notification.permission === "granted") {
        this.showBrowserNotification(payload);
      }
    });
  }

  /**
   * Show in-app notification (custom UI)
   */
  showInAppNotification(payload) {
    const title =
      payload.notification?.title || payload.data?.title || "Calendar Reminder";
    const body =
      payload.notification?.body ||
      payload.data?.body ||
      "You have an upcoming event";
    const data = payload.data || {};

    // Dispatch custom event for your app to handle
    const event = new CustomEvent("showNotification", {
      detail: {
        title,
        body,
        data,
        timestamp: new Date().toISOString(),
      },
    });
    window.dispatchEvent(event);

    console.log("📱 In-app notification dispatched:", { title, body });
  }

  /**
   * Show browser notification
   */
  showBrowserNotification(payload) {
    const title =
      payload.notification?.title || payload.data?.title || "Calendar Reminder";
    const options = {
      body:
        payload.notification?.body ||
        payload.data?.body ||
        "You have an upcoming event",
      icon: "/icon-192x192.png",
      badge: "/badge-72x72.png",
      data: payload.data || {},
      requireInteraction: true,
      vibrate: [200, 100, 200],
      silent: false,
    };

    try {
      // Try service worker first
      navigator.serviceWorker
        .getRegistration("/andromeda/")
        .then((registration) => {
          if (registration) {
            registration.showNotification(title, options);
          } else {
            // Fallback to regular notification
            new Notification(title, options);
          }
        });
    } catch (error) {
      console.error("❌ Error showing browser notification:", error);
    }
  }

  /**
   * Schedule a push notification in Firestore
   */
  // In notificationService.js, update the scheduleNotification method:

  async scheduleNotification(reminderData) {
    const user = auth.currentUser;
    if (!user) return null;

    try {
      const notificationRef = doc(
        collection(db, "users", user.uid, "pushNotifications"),
      );

      // Generate or get a unique device ID
      const deviceId = this.getDeviceId();

      await setDoc(notificationRef, {
        id: notificationRef.id,
        userId: user.uid,
        userEmail: user.email,
        title: "🔔 Calendar Reminder",
        body: reminderData.message,
        eventId: reminderData.eventId,
        eventName: reminderData.eventName,
        dateKey: reminderData.dateKey,
        fireAt: reminderData.fireAt,
        scheduledFor: new Date(reminderData.fireAt).toISOString(),
        status: "scheduled",
        createdAt: new Date().toISOString(),
        deviceId: deviceId, // 👈 Add device ID
        deviceType: this.getDeviceType(), // 👈 Add device type for debugging
        data: {
          click_action: "OPEN_CALENDAR",
          date: reminderData.dateKey,
          type: "calendar_reminder",
          eventId: reminderData.eventId,
          eventName: reminderData.eventName,
        },
      });

      console.log("✅ Push notification scheduled for device:", deviceId);
      return notificationRef.id;
    } catch (error) {
      console.error("❌ Error scheduling push notification:", error);
      return null;
    }
  }

  // Add helper methods to notificationService.js:

  getDeviceId() {
    // Try to get existing device ID from localStorage
    let deviceId = localStorage.getItem("calendar_device_id");

    if (!deviceId) {
      // Generate a new device ID
      deviceId =
        "device_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      localStorage.setItem("calendar_device_id", deviceId);
    }

    return deviceId;
  }

  getDeviceType() {
    const ua = navigator.userAgent;
    if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
      return "tablet";
    }
    if (
      /Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/.test(
        ua,
      )
    ) {
      return "mobile";
    }
    return "desktop";
  }
  /**
   * Cancel a scheduled notification
   */
  async cancelNotification(notificationId) {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const notificationRef = doc(
        db,
        "users",
        user.uid,
        "pushNotifications",
        notificationId,
      );
      await deleteDoc(notificationRef);
      console.log("✅ Notification cancelled:", notificationId);
      return true;
    } catch (error) {
      console.error("❌ Error cancelling notification:", error);
      return false;
    }
  }

  /**
   * Get all scheduled notifications for current user
   */
  async getScheduledNotifications() {
    const user = auth.currentUser;
    if (!user) return [];

    try {
      const notificationsRef = collection(
        db,
        "users",
        user.uid,
        "pushNotifications",
      );
      const q = query(
        notificationsRef,
        where("status", "==", "scheduled"),
        where("fireAt", ">=", Date.now()),
      );

      const snapshot = await getDocs(q);
      const notifications = [];
      snapshot.forEach((doc) => {
        notifications.push({ id: doc.id, ...doc.data() });
      });

      return notifications;
    } catch (error) {
      console.error("❌ Error getting scheduled notifications:", error);
      return [];
    }
  }

  /**
   * Delete all tokens for current user (e.g., on logout)
   */
  async deleteAllTokens() {
    const user = auth.currentUser;
    if (!user) return;

    try {
      const tokensRef = collection(db, "users", user.uid, "fcmTokens");
      const snapshot = await getDocs(tokensRef);

      const deletePromises = [];
      snapshot.forEach((doc) => {
        deletePromises.push(deleteDoc(doc.ref));
      });

      await Promise.all(deletePromises);
      console.log("✅ All FCM tokens deleted for user:", user.uid);
    } catch (error) {
      console.error("❌ Error deleting FCM tokens:", error);
    }
  }

  /**
   * Clean up listeners
   */
  cleanup() {
    if (this.messageListener) {
      this.messageListener();
      this.messageListener = null;
    }
    this.isInitialized = false;
    console.log("📱 Notification service cleaned up");
  }
}

// Create and export singleton instance
const notificationService = new NotificationService();
export default notificationService;
