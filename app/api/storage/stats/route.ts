import { NextResponse } from "next/server";
import { ref, list } from "firebase/storage";
import { storage, AUDIO_BUCKET_PATH } from "@/lib/firebase";
import { getAdminStorage } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

async function countFilesAdmin(): Promise<number> {
  const bucket = getAdminStorage();
  if (!bucket) return -1;

  const prefix = AUDIO_BUCKET_PATH.endsWith("/") ? AUDIO_BUCKET_PATH : AUDIO_BUCKET_PATH + "/";
  let count = 0;
  let nextOpts: Record<string, unknown> | null = { prefix, maxResults: 1000, autoPaginate: false };

  while (nextOpts) {
    const result = await bucket.getFiles(nextOpts);
    const files = result[0];
    const next: unknown = result[1];
    count += files.filter((f) => f.name.toLowerCase().endsWith(".mp3")).length;
    nextOpts = next && typeof next === "object" ? (next as Record<string, unknown>) : null;
    if (count > 50000) break;
  }
  return count;
}

async function countFilesClient(): Promise<number> {
  let count = 0;
  let pageToken: string | undefined;

  do {
    const listRef = ref(storage, AUDIO_BUCKET_PATH);
    const result = await list(listRef, { maxResults: 1000, pageToken });
    count += result.items.filter((i) => i.name.endsWith(".mp3")).length;
    pageToken = (result as { nextPageToken?: string }).nextPageToken;
    if (count > 50000) break;
  } while (pageToken);

  return count;
}

export async function GET() {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError || !session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.roleName !== "Admin" && session.roleName !== "Programme Manager") {
      return NextResponse.json({ error: "Admin or Programme Manager only" }, { status: 403 });
    }

    let total = 0;
    try {
      const adminCount = await countFilesAdmin();
      if (adminCount >= 0) {
        total = adminCount;
      } else {
        total = await countFilesClient();
      }
    } catch {
      total = 0;
    }

    const { count: published } = await supabase
      .from("audio_programmes")
      .select("id", { count: "exact", head: true })
      .not("firebase_storage_path", "is", null)
      .like("firebase_storage_path", "audio/%");

    const publishedCount = published ?? 0;
    const remaining = Math.max(0, total - publishedCount);

    return NextResponse.json({
      total,
      published: publishedCount,
      remaining,
    });
  } catch (err) {
    console.error("Storage stats error:", err);
    return NextResponse.json(
      { error: "Failed to get stats" },
      { status: 500 }
    );
  }
}
