import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { getAdminStorage, getAdminStorageFailureReason } from "@/lib/firebase-admin";

/**
 * GET /api/upload/check-config
 * Returns why upload is or isn't configured (for debugging on Vercel).
 * Auth required.
 */
export async function GET() {
  const { error: authError } = await requireAuth();
  if (authError) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const envRaw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const envSet = Boolean(envRaw?.trim());
  let envLength: number | undefined;
  let parseOk = false;
  let hasProjectId = false;
  let hasPrivateKey = false;

  if (envRaw) {
    envLength = envRaw.length;
    try {
      const parsed = JSON.parse(envRaw.trim()) as Record<string, unknown>;
      parseOk = true;
      hasProjectId = Boolean(parsed?.project_id);
      hasPrivateKey = Boolean(parsed?.private_key && String(parsed.private_key).includes("-----BEGIN"));
    } catch {
      parseOk = false;
    }
  }

  const bucket = getAdminStorage();
  const initOk = Boolean(bucket);
  const reason = getAdminStorageFailureReason();

  return NextResponse.json({
    ok: initOk,
    reason,
    debug: {
      envSet,
      envLength,
      parseOk,
      hasProjectId,
      hasPrivateKey,
      initOk,
    },
  });
}
