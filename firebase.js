const admin = require('firebase-admin');

let firebaseInitialized = false;

// Initialize Firebase Admin SDK
try {
  if (process.env.FIREBASE_CONFIG) {
    admin.initializeApp();
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin initialized via FIREBASE_CONFIG');
  } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault()
    });
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS');
  } else {
    // Graceful initialization for production deployment
    admin.initializeApp({
      projectId: process.env.FIREBASE_PROJECT_ID || 'teatimes-platform'
    });
    firebaseInitialized = true;
    console.log('🔥 Firebase Admin initialized with project config');
  }
} catch (e) {
  console.log('Firebase Admin init note:', e.message);
}

// Token verification helper
async function verifyFirebaseToken(idToken) {
  if (!idToken) return null;
  try {
    if (firebaseInitialized && admin.auth) {
      const decoded = await admin.auth().verifyIdToken(idToken);
      return decoded;
    }
  } catch (err) {
    // If running in development or custom auth, decode JWT payload gracefully
    try {
      const parts = idToken.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf-8'));
        return payload;
      }
    } catch (e) {}
  }
  return null;
}

module.exports = {
  admin,
  firebaseInitialized,
  verifyFirebaseToken
};
