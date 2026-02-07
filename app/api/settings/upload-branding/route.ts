import { NextResponse } from "next/server";
import { getAdminStorage } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";

const BRANDING_PATH = "branding";
const MAX_BYTES = 2 * 1024 * 1024; // 2MB
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

const ALLOWED_TYPES: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/x-icon": "ico",
  "image/vnd.microsoft.icon": "ico",
  "image/svg+xml": "svg",
  "image/webp": "webp",
};

export async function POST(request: Request) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) {
      return NextResponse.json(
        { error: authError === "Forbidden" ? "Admin only" : "Unauthorized" },
        { status: authError === "Forbidden" ? 403 : 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const type = (formData.get("type") as string | null)?.toLowerCase() || "logo";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (type !== "logo" && type !== "favicon") {
      return NextResponse.json({ error: "type must be logo or favicon" }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json(
        { error: "File too large. Max 2MB." },
        { status: 400 }
      );
    }

    const ext = ALLOWED_TYPES[file.type] || (file.name.split(".").pop()?.toLowerCase() || "png");
    const safeExt = ["png", "jpg", "jpeg", "ico", "svg", "webp"].includes(ext) ? ext : "png";
    const path = `${BRANDING_PATH}/${type}_${Date.now()}.${safeExt}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const bucket = getAdminStorage();
    if (!bucket) {
      return NextResponse.json(
        { error: "Storage not configured. Set Firebase service account." },
        { status: 503 }
      );
    }

    const storageFile = bucket.file(path);
    await storageFile.save(buffer, {
      metadata: { contentType: file.type },
    });
    const [signedUrl] = await storageFile.getSignedUrl({
      action: "read",
      expires: Date.now() + ONE_YEAR_MS,
    });

    return NextResponse.json({ url: signedUrl, path });
  } catch (error) {
    console.error("Upload branding error:", error);
    return NextResponse.json(
      { error: "Upload failed" },
      { status: 500 }
    );
  }
}
