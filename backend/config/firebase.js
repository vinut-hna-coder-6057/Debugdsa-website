import admin from "firebase-admin";
import serviceAccount from "./firebaseServiceAccount.json" with { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: serviceAccount.project_id,
  });
}

export default admin;