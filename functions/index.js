const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * Triggered when a new notification is written to users/{uid}/notifications
 * Sends FCM push to all registered devices of that user.
 */
exports.sendPushOnNotification = functions.database
  .ref('users/{uid}/notifications/{notifId}')
  .onCreate(async (snap, context) => {
    const notif = snap.val();
    if (!notif || notif.read) return;

    const uid = context.params.uid;
    if (!uid) return;

    const title = notif.title || 'Kazka';
    const body = notif.body || '';
    const type = notif.type || 'info';

    // Get all FCM tokens for this user
    const tokensSnap = await admin.database().ref(`users/${uid}/fcmTokens`).once('value');
    const tokensData = tokensSnap.val();
    if (!tokensData) {
      console.log(`No FCM tokens for user ${uid}`);
      return;
    }

    const tokens = Object.values(tokensData).map(t => t.token).filter(Boolean);
    if (tokens.length === 0) return;

    const payload = {
      notification: {
        title,
        body,
        icon: 'https://adamomic371-star.github.io/appfinance/assets/icons/icon-192.png',
        badge: 'https://adamomic371-star.github.io/appfinance/assets/icons/icon-192.png',
        sound: 'default',
      },
      data: {
        type,
        clickAction: 'OPEN_KAZKA',
      },
    };

    try {
      const response = await admin.messaging().sendEachForMulticast({
        tokens,
        ...payload,
      });

      // Clean up invalid tokens
      const tokenKeys = Object.keys(tokensData);
      let removed = 0;
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const key = tokenKeys[idx];
          if (key) {
            admin.database().ref(`users/${uid}/fcmTokens/${key}`).remove()
              .catch(() => {});
            removed++;
          }
        }
      });

      console.log(`Push sent to ${response.successCount}/${tokens.length} devices for user ${uid} (removed ${removed} invalid tokens)`);
    } catch (err) {
      console.error(`FCM error for user ${uid}:`, err.message);
    }
  });
