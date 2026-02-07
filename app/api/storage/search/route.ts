import { NextResponse } from "next/server";
import { ref, list, getDownloadURL } from "firebase/storage";
import { storage, AUDIO_BUCKET_PATH } from "@/lib/firebase";
import { getAdminStorage } from "@/lib/firebase-admin";
import { requireAdmin } from "@/lib/auth";
import { supabase } from "@/lib/supabase";

const BATCH_SIZE = 100;
const ONE_YEAR_MS = 365 * 24 * 60 * 60 * 1000;

async function getUrlForPath(path: string, useAdmin: boolean): Promise<string> {
  if (useAdmin) {
    const bucket = getAdminStorage();
    if (bucket) {
      const [url] = await bucket.file(path).getSignedUrl({
        action: "read",
        expires: Date.now() + ONE_YEAR_MS,
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
    const q = (searchParams.get("q") || "").trim();
    if (!q) {
      return NextResponse.json({ error: "Search query (q) is required" }, { status: 400 });
    }

    const searchLower = q.toLowerCase();
    const useAdmin = getAdminStorage() !== null;

    // Search Supabase for programmes matching title (get storage paths)
    const { data: progMatches } = await supabase
      .from("audio_programmes")
      .select("firebase_storage_path")
      .ilike("title", `%${q}%`);
    const titleMatchedPaths = new Set((progMatches ?? []).map((p) => p.firebase_storage_path).filter(Boolean));

    const matches: { path: string; name: string }[] = [];
    let scanned = 0;
    let batchCount = 0;

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: object) => {
          controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
        };

        try {
          if (useAdmin) {
            const bucket = getAdminStorage();
            if (!bucket) throw new Error("Storage not configured");
            const prefix = AUDIO_BUCKET_PATH.endsWith("/") ? AUDIO_BUCKET_PATH : AUDIO_BUCKET_PATH + "/";
            let nextQuery: object | null = null;

            do {
              const options: {
                prefix: string;
                maxResults: number;
                autoPaginate: false;
                pageToken?: string;
              } =
                nextQuery && typeof nextQuery === "object"
                  ? { ...(nextQuery as object), prefix, maxResults: BATCH_SIZE, autoPaginate: false }
                  : { prefix, maxResults: BATCH_SIZE, autoPaginate: false };

              const [files, queryForNext] = await bucket.getFiles(options);

              const mp3Files = files
                .filter((f) => f.name.toLowerCase().endsWith(".mp3"))
                .map((f) => ({
                  path: f.name,
                  name: f.name.split("/").pop() || f.name,
                }));

              for (const f of mp3Files) {
                scanned++;
                const nameMatch = f.name.toLowerCase().includes(searchLower);
                const titleMatch = titleMatchedPaths.has(f.path);
                if (nameMatch || titleMatch) matches.push(f);
              }

              batchCount++;
              nextQuery = queryForNext && typeof queryForNext === "object" ? (queryForNext as object) : null;
              const percent = nextQuery ? Math.min(90, batchCount * 6) : 100;
              send({ type: "progress", scanned, found: matches.length, percent });
            } while (nextQuery);
          } else {
            // Fallback: Firebase client SDK (when Admin not configured)
            const listRef = ref(storage, AUDIO_BUCKET_PATH);
            let pageToken: string | undefined;

            do {
              const result = await list(listRef, {
                maxResults: BATCH_SIZE,
                pageToken: pageToken || undefined,
              });

              const items = result.items.filter((item) => item.name.toLowerCase().endsWith(".mp3"));
              for (const item of items) {
                scanned++;
                const name = item.name;
                const path = item.fullPath;
                const nameMatch = name.toLowerCase().includes(searchLower);
                const titleMatch = titleMatchedPaths.has(path);
                if (nameMatch || titleMatch) {
                  matches.push({ path, name });
                }
              }

              batchCount++;
              pageToken = (result as { nextPageToken?: string }).nextPageToken;
              const percent = pageToken ? Math.min(90, batchCount * 6) : 100;
              send({ type: "progress", scanned, found: matches.length, percent });
            } while (pageToken);
          }

          // Enrich matches with URLs and Supabase data
          const items = await Promise.all(
            matches.map(async (f) => {
              const url = await getUrlForPath(f.path, useAdmin);
              const { data: existing } = await supabase
                .from("audio_programmes")
                .select("id, title, broadcasted_date")
                .eq("firebase_storage_path", f.path)
                .single();
              return {
                path: f.path,
                name: f.name,
                url,
                existing: existing
                  ? { id: existing.id, title: existing.title, broadcasted_date: existing.broadcasted_date }
                  : null,
              };
            })
          );

          items.sort((a, b) => {
            const aPub = a.existing ? 1 : 0;
            const bPub = b.existing ? 1 : 0;
            return aPub - bPub;
          });

          send({ type: "done", items, totalScanned: scanned, totalFound: items.length });
        } catch (err) {
          console.error("Storage search error:", err);
          send({ type: "error", error: err instanceof Error ? err.message : "Search failed" });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (err) {
    console.error("Storage search:", err);
    return NextResponse.json(
      { error: "Search failed", details: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
