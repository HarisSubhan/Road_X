const admin = require('firebase-admin');
require('dotenv').config();

let firebaseApp = null;

try {
  if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_PRIVATE_KEY) {
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert({
        project_id: process.env.FIREBASE_PROJECT_ID,
        private_key: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        client_email: process.env.FIREBASE_CLIENT_EMAIL
      })
    });
    console.log('Firebase Admin initialized successfully');
  } else {
    console.warn('Firebase credentials not provided. Push notifications will be disabled.');
  }
} catch (error) {
  console.error('Firebase initialization error:', error.message);
}

module.exports = firebaseApp ? admin.messaging() : null;
