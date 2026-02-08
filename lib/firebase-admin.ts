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
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
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

/** Returns a short reason why Firebase Admin is not available (for error messages). */
export function getAdminStorageFailureReason(): string {
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (!json) {
    return "FIREBASE_SERVICE_ACCOUNT_JSON is not set in Vercel Environment Variables. Add it (Settings → Environment Variables), paste the full JSON from your service account key, then redeploy.";
  }
  try {
    const parsed = JSON.parse(json) as ServiceAccountCred;
    if (!parsed.project_id || !parsed.private_key) {
      return "FIREBASE_SERVICE_ACCOUNT_JSON is set but missing project_id or private_key. Paste the complete JSON from your Firebase service account key file.";
    }
  } catch {
    return "FIREBASE_SERVICE_ACCOUNT_JSON is set but invalid JSON. Paste the exact contents of your service account key file as one line (no extra quotes around the whole value).";
  }
  return "Firebase Admin failed to initialize. Check that the JSON is correct and redeploy.";
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
