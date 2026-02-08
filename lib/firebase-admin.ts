import { readFileSync } from "fs";
import { resolve } from "path";
import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";

let adminApp: App | null = null;

type ServiceAccountCred = {
  project_id?: string;
  private_key?: string;
  [key: string]: unknown;
};

function getServiceAccount(): ServiceAccountCred | null {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (json) {
    try {
      return JSON.parse(json) as ServiceAccountCred;
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
      return JSON.parse(data) as ServiceAccountCred;
    } catch {
      return null;
    }
  }
  return null;
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

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
        credential: cert(serviceAccount as Parameters<typeof cert>[0]),
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

/** Get a signed read URL for a storage path (e.g. after client direct upload). */
export async function getSignedReadUrl(storagePath: string): Promise<string | null> {
  const bucket = getAdminStorage();
  if (!bucket) return null;
  try {
    const [url] = await bucket.file(storagePath).getSignedUrl({
      action: "read",
      expires: Date.now() + ONE_YEAR_MS,
    });
    return url;
  } catch {
    return null;
  }
}
