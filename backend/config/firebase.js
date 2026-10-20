import admin from "firebase-admin";
import { existsSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const serviceAccountPath = fileURLToPath(new URL("./firebaseServiceAccount.json", import.meta.url));
const serviceAccount = existsSync(serviceAccountPath)
  ? JSON.parse(readFileSync(serviceAccountPath, "utf8"))
  : null;

if (!admin.apps.length) {
  const projectId = serviceAccount?.project_id || process.env.GCLOUD_PROJECT || process.env.GOOGLE_CLOUD_PROJECT;
  admin.initializeApp({
    credential: serviceAccount
      ? admin.credential.cert(serviceAccount)
      : admin.credential.applicationDefault(),
    ...(projectId ? { projectId } : {}),
  });
}

export default admin;
