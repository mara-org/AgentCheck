import { getApps, initializeApp, cert, applicationDefault } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp, FieldValue } from "firebase-admin/firestore";

function getServiceAccount() {
  const encoded =
    process.env.AUTH_SERVICE_ACCOUNT_BASE64 ?? process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  if (encoded) {
    return JSON.parse(Buffer.from(encoded, "base64").toString("utf8"));
  }

  const projectId = process.env.AUTH_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID;
  const clientEmail =
    process.env.AUTH_CLIENT_EMAIL ?? process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = (
    process.env.AUTH_PRIVATE_KEY ?? process.env.FIREBASE_PRIVATE_KEY
  )?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return { projectId, clientEmail, privateKey };
  }

  return null;
}

export function getAdminApp() {
  const existing = getApps()[0];
  if (existing) return existing;

  const serviceAccount = getServiceAccount();
  if (serviceAccount) {
    return initializeApp({
      credential: cert(serviceAccount),
      projectId: serviceAccount.projectId,
    });
  }

  if (process.env.AUTH_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID) {
    return initializeApp({
      credential: applicationDefault(),
      projectId: process.env.AUTH_PROJECT_ID ?? process.env.FIREBASE_PROJECT_ID,
    });
  }

  throw new Error("Secure workspace access is not configured yet.");
}

export function getAdminAuth() {
  return getAuth(getAdminApp());
}

export function getAdminDb() {
  return getFirestore(getAdminApp());
}

export { Timestamp, FieldValue };
