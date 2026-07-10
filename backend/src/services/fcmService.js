const messaging = require('../config/firebase');

async function sendPushNotification(userId, titleEn, titleUr, bodyEn, bodyUr, data = {}) {
  if (!messaging) {
    console.log('Firebase not configured, skipping push notification');
    return;
  }

  try {
    const db = require('../config/db');
    const [users] = await db.query('SELECT fcm_token, preferred_language FROM users WHERE id = ?', [userId]);
    
    if (!users.length || !users[0].fcm_token) {
      console.log('No FCM token found for user:', userId);
      return;
    }

    const user = users[0];
    const title = user.preferred_language === 'ur' ? titleUr : titleEn;
    const body = user.preferred_language === 'ur' ? bodyUr : bodyEn;

    const message = {
      token: user.fcm_token,
      notification: {
        title: title,
        body: body
      },
      data: data
    };

    await messaging.send(message);
    console.log('Push notification sent successfully to user:', userId);
  } catch (error) {
    if (error.code === 'messaging/registration-token-not-registered') {
      console.log('FCM token invalid, clearing it for user:', userId);
      const db = require('../config/db');
      await db.query('UPDATE users SET fcm_token = NULL WHERE id = ?', [userId]);
    } else {
      console.error('FCM send error:', error.message);
    }
  }
}

async function sendBroadcastNotification(targetRole, titleEn, titleUr, bodyEn, bodyUr, data = {}) {
  if (!messaging) {
    console.log('Firebase not configured, skipping broadcast notification');
    return;
  }

  try {
    const db = require('../config/db');
    let query = 'SELECT fcm_token, preferred_language FROM users WHERE fcm_token IS NOT NULL AND is_active = 1';
    const params = [];

    if (targetRole === 'customers') {
      query += ' AND role = ?';
      params.push('customer');
    } else if (targetRole === 'providers') {
      query += ' AND role = ?';
      params.push('provider');
    }

    const [users] = await db.query(query, params);

    for (const user of users) {
      const title = user.preferred_language === 'ur' ? titleUr : titleEn;
      const body = user.preferred_language === 'ur' ? bodyUr : bodyEn;

      const message = {
        token: user.fcm_token,
        notification: {
          title: title,
          body: body
        },
        data: data
      };

      try {
        await messaging.send(message);
      } catch (error) {
        console.error('Failed to send to user:', user.id, error.message);
      }
    }

    console.log(`Broadcast notification sent to ${users.length} users`);
  } catch (error) {
    console.error('Broadcast notification error:', error.message);
  }
}

module.exports = { sendPushNotification, sendBroadcastNotification };
