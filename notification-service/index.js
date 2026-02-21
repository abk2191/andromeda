const express = require("express");
const admin = require("firebase-admin");

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY
    ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n")
    : undefined,
};

// Check if we have the required credentials
if (
  !serviceAccount.projectId ||
  !serviceAccount.clientEmail ||
  !serviceAccount.privateKey
) {
  console.error(
    "❌ Missing Firebase credentials. Please check your environment variables.",
  );
  process.exit(1);
}

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log("✅ Firebase Admin initialized");
}

const db = admin.firestore();

// Health check endpoint (for Railway to know the service is alive)
app.get("/", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Notification service is running",
    timestamp: new Date().toISOString(),
  });
});

// Main notification check endpoint (called by cron-job.org)
app.get("/trigger-notifications", async (req, res) => {
  console.log("🔍 Notification check triggered at:", new Date().toISOString());

  // Optional: Add a secret key for security
  const secretKey = process.env.CRON_SECRET;
  if (secretKey && req.query.secret !== secretKey) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const result = await checkNotifications();
    res.status(200).json({
      success: true,
      sent: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error in notification check:", error);
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// The actual notification checking logic (copied from your checkNotifications.js)
async function checkNotifications() {
  console.log("🔍 Checking for due notifications...");

  try {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // Look back 1 minute

    const usersSnapshot = await db.collection("users").get();
    let totalSent = 0;

    console.log(`👥 Found ${usersSnapshot.size} users`);

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;

      // Find due notifications
      const dueNotifications = await db
        .collection("users")
        .doc(userId)
        .collection("pushNotifications")
        .where("fireAt", "<=", now)
        .where("fireAt", ">=", oneMinuteAgo)
        .where("status", "==", "scheduled")
        .get();

      if (dueNotifications.empty) continue;

      console.log(`📋 Found ${dueNotifications.size} for user ${userId}`);

      // Get user's FCM tokens (document IDs are the tokens)
      const tokensSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("fcmTokens")
        .get();

      const tokens = tokensSnapshot.docs.map((doc) => doc.id);

      if (tokens.length === 0) {
        console.log(`⚠️ No tokens for user ${userId}`);
        continue;
      }

      // Send each due notification
      for (const notificationDoc of dueNotifications.docs) {
        const notification = notificationDoc.data();

        const message = {
          notification: {
            title: notification.title || "🔔 Calendar Reminder",
            body: notification.body || "You have an upcoming event",
          },
          data: {
            eventId: notification.eventId || "",
            eventName: notification.eventName || "",
            dateKey: notification.dateKey || "",
            type: "calendar_reminder",
            id: notificationDoc.id,
          },
          tokens: tokens,
        };

        const response = await admin.messaging().sendEachForMulticast(message);
        totalSent += response.successCount;

        await notificationDoc.ref.update({
          status: "sent",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        // Remove invalid tokens
        if (response.failureCount > 0) {
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              db.collection("users")
                .doc(userId)
                .collection("fcmTokens")
                .doc(tokens[idx])
                .delete()
                .catch((err) => console.log("Error removing token:", err));
            }
          });
        }
      }
    }

    console.log(`✅ Done. Sent: ${totalSent}`);
    return totalSent;
  } catch (error) {
    console.error("❌ Error:", error);
    throw error;
  }
}

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Notification service running on port ${PORT}`);
  console.log(`📝 Endpoints:`);
  console.log(`   - Health check: http://localhost:${PORT}/`);
  console.log(`   - Trigger: http://localhost:${PORT}/trigger-notifications`);
});
