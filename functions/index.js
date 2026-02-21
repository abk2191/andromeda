// const functions = require("firebase-functions");
// const admin = require("firebase-admin");

// admin.initializeApp();
// const db = admin.firestore();

// // Scheduled function - runs every minute (Blaze plan required)
// exports.checkScheduledNotifications = functions.pubsub
//   .schedule("* * * * *")
//   .timeZone("UTC")
//   .onRun(async (context) => {
//     console.log(
//       "🔍 Checking for due notifications at:",
//       new Date().toISOString(),
//     );
//     await checkAndSendNotifications();
//     return null;
//   });

// // HTTP function for manual testing
// exports.manualCheck = functions.https.onRequest(async (req, res) => {
//   try {
//     const result = await checkAndSendNotifications();
//     res.status(200).json({ success: true, sent: result });
//   } catch (error) {
//     res.status(500).json({ error: error.message });
//   }
// });

// // Core notification logic
// async function checkAndSendNotifications() {
//   try {
//     const now = Date.now();
//     const oneMinuteAgo = now - 60000;

//     const usersSnapshot = await db.collection("users").get();
//     let totalSent = 0;

//     console.log(`👥 Found ${usersSnapshot.size} users`);

//     for (const userDoc of usersSnapshot.docs) {
//       const userId = userDoc.id;

//       const dueNotifications = await db
//         .collection("users")
//         .doc(userId)
//         .collection("pushNotifications")
//         .where("fireAt", "<=", now)
//         .where("fireAt", ">=", oneMinuteAgo)
//         .where("status", "==", "scheduled")
//         .get();

//       if (dueNotifications.empty) continue;

//       const tokensSnapshot = await db
//         .collection("users")
//         .doc(userId)
//         .collection("fcmTokens")
//         .get();

//       const tokens = tokensSnapshot.docs.map((doc) => doc.id);
//       if (tokens.length === 0) continue;

//       for (const notificationDoc of dueNotifications.docs) {
//         const notification = notificationDoc.data();

//         const message = {
//           notification: {
//             title: notification.title || "🔔 Calendar Reminder",
//             body: notification.body || "You have an upcoming event",
//           },
//           tokens: tokens,
//         };

//         const response = await admin.messaging().sendEachForMulticast(message);
//         totalSent += response.successCount;

//         await notificationDoc.ref.update({
//           status: "sent",
//           sentAt: admin.firestore.FieldValue.serverTimestamp(),
//         });

//         // Clean up invalid tokens
//         if (response.failureCount > 0) {
//           response.responses.forEach((resp, idx) => {
//             if (!resp.success) {
//               db.collection("users")
//                 .doc(userId)
//                 .collection("fcmTokens")
//                 .doc(tokens[idx])
//                 .delete()
//                 .catch((err) => console.log("Error removing token:", err));
//             }
//           });
//         }
//       }
//     }

//     console.log(`✅ Done. Sent: ${totalSent}`);
//     return totalSent;
//   } catch (error) {
//     console.error("❌ Error:", error);
//     throw error;
//   }
// }
