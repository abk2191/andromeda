const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();

// This runs every minute to check for due notifications
exports.sendScheduledNotifications = functions.pubsub
  .schedule("every 1 minutes")
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = Date.now();
    const oneMinuteAgo = now - 60000;
    const oneMinuteFromNow = now + 60000;

    console.log("🔍 Checking for due notifications...");

    try {
      // Find all scheduled notifications that are due
      const usersSnapshot = await db.collection("users").get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Get due notifications for this user
        const notificationsRef = db
          .collection("users")
          .doc(userId)
          .collection("pushNotifications");

        const dueNotifications = await notificationsRef
          .where("fireAt", ">=", oneMinuteAgo)
          .where("fireAt", "<=", oneMinuteFromNow)
          .where("status", "==", "scheduled")
          .get();

        if (dueNotifications.empty) continue;

        console.log(
          `📋 Found ${dueNotifications.size} due notifications for user ${userId}`,
        );

        // Get ALL tokens for this user (from all devices)
        const tokensRef = db
          .collection("users")
          .doc(userId)
          .collection("fcmTokens");

        const tokensSnapshot = await tokensRef.get();
        const tokens = tokensSnapshot.docs.map((doc) => doc.data().token);

        if (tokens.length === 0) {
          console.log(`⚠️ No FCM tokens found for user ${userId}`);
          continue;
        }

        console.log(
          `📱 Sending to ${tokens.length} devices for user ${userId}`,
        );

        // Send notification to each due reminder
        for (const notificationDoc of dueNotifications.docs) {
          const notification = notificationDoc.data();

          // Create message
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
              click_action: "OPEN_CALENDAR",
            },
            tokens: tokens, // Send to ALL user devices
          };

          try {
            // Send to all tokens at once
            const response = await admin
              .messaging()
              .sendEachForMulticast(message);

            console.log(
              `✅ Sent notification to ${response.successCount} devices for user ${userId}`,
            );

            // Handle failed tokens
            if (response.failureCount > 0) {
              response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                  console.log(
                    `❌ Token ${tokens[idx].substring(0, 20)}... failed:`,
                    resp.error,
                  );
                  // Optionally remove invalid tokens
                  // await tokensRef.doc(tokens[idx]).delete();
                }
              });
            }

            // Mark notification as sent
            await notificationDoc.ref.update({
              status: "sent",
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              deviceCount: response.successCount,
            });
          } catch (error) {
            console.error("Error sending notification:", error);
          }
        }
      }

      console.log("✅ Notification check complete");
      return null;
    } catch (error) {
      console.error("Error in scheduled function:", error);
      return null;
    }
  });
