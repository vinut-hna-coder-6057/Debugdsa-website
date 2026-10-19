import { initializeApp } from "firebase/app";

import {
  getAuth,
  GoogleAuthProvider
} from "firebase/auth";

const firebaseConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  measurementId: process.env.REACT_APP_FIREBASE_MEASUREMENT_ID,
};

const requiredConfig = [
  "apiKey",
  "authDomain",
  "projectId",
  "messagingSenderId",
  "appId",
];
const missingConfig = requiredConfig.filter((key) => !firebaseConfig[key]);

if (missingConfig.length > 0) {
  throw new Error(
    `Missing Firebase configuration: ${missingConfig.join(", ")}. ` +
      "Set the REACT_APP_FIREBASE_* values in frontend/.env and restart the frontend."
  );
}

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);

export const provider =
  new GoogleAuthProvider();

export default app;