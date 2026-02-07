import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

let adminApp: App | null = null;

function getServiceAccount() {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return JSON.parse(json) as Parameters<typeof cert>[0];
    } catch {
      return null;
    }
  }
  const path =
    process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
    process.env.GOOGLE_APPLICATION_CREDENTIALS;
  if (path) {
    try {
      const absPath = resolve(process.cwd(), path);
      const data = readFileSync(absPath, "utf-8");
      return JSON.parse(data) as Parameters<typeof cert>[0];
    } catch {
      return null;
    }
  }
  return null;
}

export function getAdminStorage() {
  if (adminApp) {
    return getStorage(adminApp).bucket();
  }

  const serviceAccount = getServiceAccount();
  if (!serviceAccount?.project_id || !serviceAccount?.private_key) {
    return null;
  }

  try {
    if (getApps().length === 0) {
      const bucketName =
        process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ||
        `${serviceAccount.project_id}.appspot.com`;
      adminApp = initializeApp({
        credential: cert(serviceAccount),
        storageBucket: bucketName,
      });
    } else {
      adminApp = getApps()[0] as App;
    }
    return getStorage(adminApp).bucket();
  } catch {
    return null;
  }
}
