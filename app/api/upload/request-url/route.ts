import { NextResponse } from "next/server";
import { AUDIO_BUCKET_PATH } from "@/lib/firebase";
import { getAdminStorage, getAdminStorageFailureReason } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { buildProgrammeFilename } from "@/lib/upload-utils";

const ONE_HOUR_MS = 60 * 60 * 1000;

/**
 * Returns a signed URL for the client to upload the file directly (PUT).
 * Avoids sending the file through the server, so it works on Vercel (no payload limit).
 */
export async function POST(request: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.roleName === "Viewer") {
      return NextResponse.json({ error: "Viewers cannot upload files" }, { status: 403 });
    }

    const bucket = getAdminStorage();
    if (!bucket) {
      return NextResponse.json(
        {
          error: "Upload not configured",
          details: getAdminStorageFailureReason(),
        },
        { status: 503 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const categoryName = (body.category_name as string) ?? "";
    const subcategoryName = (body.subcategory_name as string) ?? "";
    const broadcastedDate = (body.broadcasted_date as string) ?? "";

    const customName = buildProgrammeFilename(categoryName, subcategoryName, broadcastedDate);
    const path = `${AUDIO_BUCKET_PATH}/${customName}`;
    const storageFile = bucket.file(path);

    const [uploadUrl] = await storageFile.getSignedUrl({
      version: "v4",
      action: "write",
      expires: Date.now() + ONE_HOUR_MS,
      contentType: "audio/mpeg",
    });

    return NextResponse.json({ uploadUrl, path });
  } catch (error) {
    console.error("Upload request-url error:", error);
    return NextResponse.json(
      { error: "Failed to get upload URL" },
      { status: 500 }
    );
  }
}
