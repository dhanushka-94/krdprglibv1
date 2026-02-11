import { NextResponse } from "next/server";
import { AUDIO_BUCKET_PATH, MAX_FILE_SIZE_BYTES } from "@/lib/firebase";
import { getAdminStorage, getAdminStorageFailureReason } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";

const ALLOWED_MIME = "audio/mpeg";
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

/** Sanitize for use in storage filename: letters, numbers, hyphens, underscores only. */
function sanitizeForFilename(s: string): string {
  return (s || "")
    .trim()
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "_")
    .replace(/_+/g, "_")
    .replace(/^-+|-+$/g, "") || "Uncategorized";
}

/** Build storage filename: Category_Subcategory_YYYY-MM-DD_timestamp.mp3 */
function buildProgrammeFilename(
  categoryName: string,
  subcategoryName: string,
  broadcastedDate: string
): string {
  const cat = sanitizeForFilename(categoryName) || "Uncategorized";
  const sub = sanitizeForFilename(subcategoryName) || "Uncategorized";
  const date = (broadcastedDate || "").trim().slice(0, 10) || "no-date";
  const timestamp = Date.now();
  return `${cat}_${sub}_${date}_${timestamp}.mp3`;
}

export async function POST(request: Request) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const categoryName = (formData.get("category_name") as string | null) ?? "";
    const subcategoryName = (formData.get("subcategory_name") as string | null) ?? "";
    const broadcastedDate = (formData.get("broadcasted_date") as string | null) ?? "";

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    const ext = file.name.toLowerCase().slice(-4);
    if (ext !== ".mp3") {
      return NextResponse.json(
        { error: "Only .mp3 files are allowed" },
        { status: 400 }
      );
    }

    if (file.type !== ALLOWED_MIME && !file.name.endsWith(".mp3")) {
      return NextResponse.json(
        { error: "Invalid file type. Only MP3 allowed." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "File size exceeds 100MB limit" },
        { status: 400 }
      );
    }

    const timestamp = Date.now();
    const customName = buildProgrammeFilename(categoryName, subcategoryName, broadcastedDate);
    const path = `${AUDIO_BUCKET_PATH}/${customName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const bucket = getAdminStorage();
    if (!bucket) {
      console.error("Firebase Admin Storage not configured.");
      return NextResponse.json(
        {
          error: "Upload not configured",
          details: getAdminStorageFailureReason(),
        },
        { status: 503 }
      );
    }

    const storageFile = bucket.file(path);
    await storageFile.save(buffer, {
      metadata: { contentType: ALLOWED_MIME },
    });
    const [signedUrl] = await storageFile.getSignedUrl({
      action: "read",
      expires: Date.now() + ONE_YEAR_MS,
    });

    return NextResponse.json({
      url: signedUrl,
      path,
      file_size_bytes: file.size,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    const details = error instanceof Error && "code" in error ? String((error as { code?: string }).code) : "";
    console.error("Upload error:", error);
    return NextResponse.json(
      {
        error: "Upload failed",
        details:
          process.env.NODE_ENV === "development"
            ? `${message}${details ? ` (${details})` : ""}`
            : undefined,
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { error: authError } = await requireAuth();
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const { searchParams } = new URL(request.url);
    const path = searchParams.get("path");

    if (!path) {
      return NextResponse.json(
        { error: "Storage path required" },
        { status: 400 }
      );
    }

    const bucket = getAdminStorage();
    if (!bucket) {
      return NextResponse.json(
        { error: "Delete not configured. Set Firebase service account (FIREBASE_SERVICE_ACCOUNT_JSON or FIREBASE_SERVICE_ACCOUNT_PATH)." },
        { status: 503 }
      );
    }

    await bucket.file(path).delete();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete from storage error:", error);
    return NextResponse.json(
      { error: "Failed to delete file from storage" },
      { status: 500 }
    );
  }
}
