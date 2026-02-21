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

    // 🔍 DETAILED USER LOGGING
    console.log(`👥 Found ${usersSnapshot.size} users total`);

    // Log each user ID
    if (usersSnapshot.size > 0) {
      console.log("📋 Listing all users:");
      usersSnapshot.forEach((doc, index) => {
        console.log(`   User ${index + 1}: ${doc.id}`);
        // Optional: Log user document data
        // console.log(`      Data:`, doc.data());
      });
    } else {
      console.log("❌ NO USERS FOUND - Check Firestore permissions!");
    }

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`\n🔍 Processing user: ${userId}`);

      // Find due notifications
      const dueNotifications = await db
        .collection("users")
        .doc(userId)
        .collection("pushNotifications")
        .where("fireAt", "<=", now)
        .where("fireAt", ">=", oneMinuteAgo)
        .where("status", "==", "scheduled")
        .get();

      console.log(
        `   📋 Found ${dueNotifications.size} due notifications for this user`,
      );

      if (dueNotifications.empty) {
        console.log(`   ⏰ No due notifications for user ${userId}`);
        continue;
      }

      // Log each due notification
      dueNotifications.forEach((notifDoc, index) => {
        const notif = notifDoc.data();
        console.log(`   📝 Notification ${index + 1}:`);
        console.log(`      ID: ${notifDoc.id}`);
        console.log(`      Title: ${notif.title}`);
        console.log(`      Body: ${notif.body}`);
        console.log(`      FireAt: ${new Date(notif.fireAt).toLocaleString()}`);
        console.log(`      Status: ${notif.status}`);
      });

      // Get user's FCM tokens (document IDs are the tokens)
      const tokensSnapshot = await db
        .collection("users")
        .doc(userId)
        .collection("fcmTokens")
        .get();

      const tokens = tokensSnapshot.docs.map((doc) => doc.id);
      console.log(`   🔑 Found ${tokens.length} FCM tokens for this user`);

      if (tokens.length > 0) {
        tokens.forEach((token, idx) => {
          console.log(`      Token ${idx + 1}: ${token.substring(0, 20)}...`);
        });
      }

      if (tokens.length === 0) {
        console.log(`   ⚠️ No tokens for user ${userId}`);
        continue;
      }

      // Send each due notification
      for (const notificationDoc of dueNotifications.docs) {
        const notification = notificationDoc.data();
        console.log(`   📤 Sending notification: "${notification.body}"`);

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
        console.log(
          `   ✅ Response: ${response.successCount} sent, ${response.failureCount} failed`,
        );

        totalSent += response.successCount;

        await notificationDoc.ref.update({
          status: "sent",
          sentAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`   ✅ Notification marked as sent in Firestore`);

        // Remove invalid tokens
        if (response.failureCount > 0) {
          console.log(`   🔄 Removing ${response.failureCount} invalid tokens`);
          response.responses.forEach((resp, idx) => {
            if (!resp.success) {
              console.log(
                `      Removing token: ${tokens[idx].substring(0, 20)}...`,
              );
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

    console.log(`\n✅ Done. Total notifications sent: ${totalSent}`);
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
