// functions/scheduledNotifications.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");

// Initialize admin if not already initialized
if (!admin.apps.length) {
  admin.initializeApp();
}

// This function runs every minute to check for due notifications
exports.checkScheduledNotifications = functions.pubsub
  .schedule("* * * * *") // Runs every minute
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log(
      "🔍 Checking for due notifications at:",
      new Date().toISOString(),
    );

    try {
      const now = Date.now();
      const oneMinuteAgo = now - 60000; // Notifications due in the last minute

      // Get all users who have notifications
      const usersSnapshot = await admin.firestore().collection("users").get();
      console.log(`👥 Found ${usersSnapshot.size} users`);

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Query due notifications for this user
        const notificationsRef = admin
          .firestore()
          .collection("users")
          .doc(userId)
          .collection("pushNotifications");

        const dueNotifications = await notificationsRef
          .where("fireAt", "<=", now)
          .where("fireAt", ">=", oneMinuteAgo)
          .where("status", "==", "scheduled")
          .get();

        if (dueNotifications.empty) {
          continue;
        }

        console.log(
          `📨 Found ${dueNotifications.size} due notifications for user ${userId}`,
        );

        // Get user's FCM tokens
        const tokensSnapshot = await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .collection("fcmTokens")
          .get();

        const tokens = [];
        tokensSnapshot.forEach((tokenDoc) => {
          tokens.push(tokenDoc.id); // Token is the document ID
        });

        if (tokens.length === 0) {
          console.log(`⚠️ No FCM tokens found for user ${userId}`);

          // Mark notifications as sent (but note that no tokens were available)
          for (const notificationDoc of dueNotifications.docs) {
            await notificationDoc.ref.update({
              status: "sent",
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              note: "No FCM tokens available - notification logged only",
            });
          }
          continue;
        }

        // Send notifications for each due reminder
        for (const notificationDoc of dueNotifications.docs) {
          const notification = notificationDoc.data();

          // Prepare the message
          const message = {
            notification: {
              title: notification.title || "🔔 Calendar Reminder",
              body: notification.body,
            },
            data: {
              click_action: "OPEN_CALENDAR",
              date: notification.dateKey || "",
              type: "calendar_reminder",
              eventId: notification.eventId || "",
              eventName: notification.eventName || "",
              id: notificationDoc.id,
            },
            tokens: tokens,
            webpush: {
              headers: {
                Urgency: "high",
              },
              notification: {
                icon: "/andromeda/android-icon-192x192.png",
                badge: "/andromeda/android-icon-192x192.png",
                requireInteraction: true,
                vibrate: [200, 100, 200],
              },
              fcmOptions: {
                link: "/",
              },
            },
            android: {
              priority: "high",
              notification: {
                sound: "default",
                priority: "high",
                clickAction: "OPEN_CALENDAR",
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: "default",
                  badge: 1,
                },
              },
            },
          };

          try {
            // Send the notification
            const response = await admin
              .messaging()
              .sendEachForMulticast(message);

            console.log(
              `✅ Sent to ${response.successCount} devices, ${response.failureCount} failed`,
            );

            // Update notification status
            await notificationDoc.ref.update({
              status: "sent",
              sentAt: admin.firestore.FieldValue.serverTimestamp(),
              fcmResponse: {
                successCount: response.successCount,
                failureCount: response.failureCount,
              },
            });

            // Handle failed tokens (remove invalid ones)
            if (response.failureCount > 0) {
              response.responses.forEach((resp, idx) => {
                if (!resp.success && tokens[idx]) {
                  console.log(`❌ Removing invalid token: ${tokens[idx]}`);
                  // Remove invalid token
                  admin
                    .firestore()
                    .collection("users")
                    .doc(userId)
                    .collection("fcmTokens")
                    .doc(tokens[idx])
                    .delete()
                    .catch((err) => console.log("Error removing token:", err));
                }
              });
            }
          } catch (error) {
            console.error(
              `❌ Error sending notification ${notificationDoc.id}:`,
              error,
            );

            // Mark as failed
            await notificationDoc.ref.update({
              status: "failed",
              error: error.message,
              failedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      }

      console.log("✅ Finished checking notifications");
      return null;
    } catch (error) {
      console.error("❌ Error in scheduled notification check:", error);
      return null;
    }
  });

// Clean up old notifications (runs daily at midnight)
exports.cleanupOldNotifications = functions.pubsub
  .schedule("0 0 * * *") // Runs at midnight every day
  .timeZone("UTC")
  .onRun(async (context) => {
    console.log("🧹 Cleaning up old notifications...");

    try {
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;

      const usersSnapshot = await admin.firestore().collection("users").get();

      for (const userDoc of usersSnapshot.docs) {
        const userId = userDoc.id;

        // Delete sent/failed notifications older than 30 days
        const oldNotifications = await admin
          .firestore()
          .collection("users")
          .doc(userId)
          .collection("pushNotifications")
          .where("fireAt", "<=", thirtyDaysAgo)
          .where("status", "in", ["sent", "failed"])
          .get();

        if (oldNotifications.size > 0) {
          const batch = admin.firestore().batch();
          oldNotifications.docs.forEach((doc) => {
            batch.delete(doc.ref);
          });
          await batch.commit();
          console.log(
            `🧹 Deleted ${oldNotifications.size} old notifications for user ${userId}`,
          );
        }
      }

      console.log("✅ Cleanup completed");
      return null;
    } catch (error) {
      console.error("❌ Error cleaning up notifications:", error);
      return null;
    }
  });
