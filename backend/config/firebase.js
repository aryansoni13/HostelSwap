const admin = require('firebase-admin');
const path = require('path');

// Initialize Firebase Admin SDK
// Firebase Admin SDK requires service account credentials to access Firestore
try {
  const projectId = process.env.FIREBASE_PROJECT_ID || 'hostelswap-729ab';
  
  // Check if app is already initialized (prevents re-initialization errors)
  if (admin.apps.length === 0) {
    // Option 1: Service account JSON file path
    if (process.env.FIREBASE_SERVICE_ACCOUNT_PATH) {
      const serviceAccountPath = path.resolve(process.env.FIREBASE_SERVICE_ACCOUNT_PATH);
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
      });
      console.log('Firebase Admin initialized with service account file');
    }
    // Option 2: Service account JSON as environment variable
    else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        projectId: projectId
      });
      console.log('Firebase Admin initialized with service account from env');
    }
    // Option 3: Try to use default service account file location
    else {
      const defaultServiceAccountPath = path.join(__dirname, '..', 'serviceAccountKey.json');
      try {
        const serviceAccount = require(defaultServiceAccountPath);
        admin.initializeApp({
          credential: admin.credential.cert(serviceAccount),
          projectId: projectId
        });
        console.log('Firebase Admin initialized with default service account file');
      } catch (fileError) {
        // If no service account found, throw a helpful error
        console.error('\n❌ Firebase Admin SDK requires service account credentials!');
        console.error('Please set up a service account key:');
        console.error('1. Go to Firebase Console → Project Settings → Service Accounts');
        console.error('2. Click "Generate New Private Key"');
        console.error('3. Save the JSON file as: backend/serviceAccountKey.json');
        console.error('   OR set FIREBASE_SERVICE_ACCOUNT_PATH environment variable');
        console.error('   OR set FIREBASE_SERVICE_ACCOUNT environment variable with JSON content\n');
        throw new Error('Firebase Admin SDK credentials not found. Please set up service account key.');
      }
    }
  }
} catch (error) {
  console.error('Error initializing Firebase Admin:', error.message);
  throw error;
}

// Get Firestore instance
const db = admin.firestore();

// Get Auth instance
const auth = admin.auth();

module.exports = { admin, db, auth };

