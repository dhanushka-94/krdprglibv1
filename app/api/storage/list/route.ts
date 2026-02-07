import { NextResponse } from "next/server";
import { ref, list, getDownloadURL } from "firebase/storage";
import { storage, AUDIO_BUCKET_PATH } from "@/lib/firebase";
import { getAdminStorage } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const DEFAULT_LIMIT = 10;
const MAX_LIMIT = 50;

type ListResult = {
  files: { path: string; name: string }[];
  nextPageToken: string | null;
};

async function listWithAdmin(limit: number, pageTokenOrQuery?: string): Promise<ListResult | null> {
  const bucket = getAdminStorage();
  if (!bucket) return null;

  const prefix = AUDIO_BUCKET_PATH.endsWith("/") ? AUDIO_BUCKET_PATH : AUDIO_BUCKET_PATH + "/";
  let options: { prefix: string; maxResults: number; autoPaginate: false; pageToken?: string } = {
    prefix,
    maxResults: limit,
    autoPaginate: false,
  };
  if (pageTokenOrQuery) {
    try {
      const parsed = JSON.parse(pageTokenOrQuery) as { pageToken?: string; prefix?: string; maxResults?: number };
      options = { ...options, ...parsed, prefix, maxResults: limit, autoPaginate: false };
    } catch {
      options.pageToken = pageTokenOrQuery;
    }
  }

  const [files, nextQuery] = await bucket.getFiles(options);

  const mp3Files = files
    .filter((f) => f.name.toLowerCase().endsWith(".mp3"))
    .map((f) => ({
      path: f.name,
      name: f.name.split("/").pop() || f.name,
    }));

  const nextToken = nextQuery && typeof nextQuery === "object"
    ? JSON.stringify(nextQuery)
    : null;
  return { files: mp3Files, nextPageToken: nextToken };
}

async function listWithClient(limit: number, pageToken?: string): Promise<ListResult> {
  const listRef = ref(storage, AUDIO_BUCKET_PATH);
  const result = await list(listRef, { maxResults: limit, pageToken: pageToken || undefined });

  const files = result.items
    .filter((itemRef) => itemRef.name.endsWith(".mp3"))
    .map((itemRef) => ({
      path: itemRef.fullPath,
      name: itemRef.name,
    }));

  const nextToken = (result as { nextPageToken?: string }).nextPageToken ?? null;
  return { files, nextPageToken: nextToken };
}

const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

async function getUrlForPath(path: string, useAdmin: boolean, longLived = false): Promise<string> {
  if (useAdmin) {
    const bucket = getAdminStorage();
    if (bucket) {
      const expires = longLived ? Date.now() + ONE_YEAR_MS : Date.now() + 60 * 60 * 1000;
      const [url] = await bucket.file(path).getSignedUrl({
        action: "read",
        expires,
      });
      return url;
    }
  }
  const storageRef = ref(storage, path);
  return getDownloadURL(storageRef);
}

export async function GET(request: Request) {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) {
      return NextResponse.json(
        { error: authError === "Forbidden" ? "Admin only" : "Unauthorized" },
        { status: authError === "Forbidden" ? 403 : 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT, MAX_LIMIT);
    const pageToken = searchParams.get("pageToken") || undefined;

    let result: ListResult;
    let useAdmin = false;

    try {
      const adminResult = await listWithAdmin(limit, pageToken);
      if (adminResult !== null) {
        result = adminResult;
        useAdmin = true;
      } else {
        result = await listWithClient(limit, pageToken);
      }
    } catch {
      result = await listWithClient(limit, pageToken);
    }

    const items = await Promise.all(
      result.files.map(async (f) => {
        const url = await getUrlForPath(f.path, useAdmin, true);

        const { data: existing } = await supabase
          .from("audio_programmes")
          .select("id, title, broadcasted_date")
          .eq("firebase_storage_path", f.path)
          .single();

        return {
          path: f.path,
          name: f.name,
          url,
          existing: existing ? { id: existing.id, title: existing.title, broadcasted_date: existing.broadcasted_date } : null,
        };
      })
    );

    items.sort((a, b) => {
      const aPub = a.existing ? 1 : 0;
      const bPub = b.existing ? 1 : 0;
      return aPub - bPub;
    });

    return NextResponse.json({ items, nextPageToken: result.nextPageToken });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const details = err instanceof Error && "code" in err ? String((err as { code?: string }).code) : "";
    console.error("Storage list error:", err);
    return NextResponse.json(
      {
        error: "Failed to list storage files",
        details: message + (details ? ` (${details})` : ""),
      },
      { status: 500 }
    );
  }
}
