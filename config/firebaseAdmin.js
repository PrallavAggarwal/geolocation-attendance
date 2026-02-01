// config/firebaseAdmin.js
import dotenv from "dotenv";
dotenv.config();
import admin from "firebase-admin";

let app;

if (!admin.apps.length) {
  // prevent multiple initializations
  const serviceAccount = {
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"), // fix line breaks
  };

  app = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    // databaseURL: `https://${process.env.FIREBASE_PROJECT_ID}.firebaseio.com`, // optional
  });
} else {
  app = admin.app(); // use existing
}

const db = admin.firestore();

export { admin, db };
