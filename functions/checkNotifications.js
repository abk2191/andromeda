// functions/checkNotifications.js
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  // Handle the private key formatting (GitHub Actions needs this)
  privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
};

// Initialize if not already initialized
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();

async function checkNotifications() {
  console.log(
    "🔍 Checking for due notifications at:",
    new Date().toISOString(),
  );

  try {
    const now = Date.now();
    const oneMinuteAgo = now - 60000; // Look back 1 minute

    const usersSnapshot = await db.collection("users").get();
    let totalSent = 0;

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
                .delete();
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

// Run the function
checkNotifications()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
