import admin from "firebase-admin";

////////////////////////////////////////////////////////////
// INITIALIZE FIREBASE ADMIN
////////////////////////////////////////////////////////////

if (!admin.apps.length) {
  try {
    let serviceAccount;

    if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON);
    } else {
      const module = await import("./firebaseServiceAccount.json", {
        with: { type: "json" },
      });
      serviceAccount = module.default;
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: serviceAccount.project_id,
    });
  } catch (err) {
    console.warn(
      "Firebase Admin SDK not initialized:",
      err.message
    );
  }
}

////////////////////////////////////////////////////////////
// EXPORT ADMIN INSTANCE
////////////////////////////////////////////////////////////

export default admin;
