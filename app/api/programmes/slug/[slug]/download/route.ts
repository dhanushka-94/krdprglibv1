import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { normalizeProgrammeSlug } from "@/lib/slug-utils";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const normalizedSlug = normalizeProgrammeSlug(slug);
    const { data: programme, error } = await supabase
      .from("audio_programmes")
      .select("firebase_storage_url, slug, title")
      .eq("slug", normalizedSlug)
      .single();

    if (error || !programme?.firebase_storage_url) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const res = await fetch(programme.firebase_storage_url, {
      headers: { Accept: "audio/mpeg" },
    });

    if (!res.ok || !res.body) {
      return NextResponse.json(
        { error: "Failed to fetch audio" },
        { status: 502 }
      );
    }

    const safeName = `${(programme.slug || programme.title || "audio").replace(/[^a-zA-Z0-9-_]/g, "_")}.mp3`;
    const disposition = `attachment; filename="${safeName}"`;

    return new NextResponse(res.body, {
      status: 200,
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Disposition": disposition,
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch (err) {
    console.error("Download error:", err);
    return NextResponse.json(
      { error: "Download failed" },
      { status: 500 }
    );
  }
}
