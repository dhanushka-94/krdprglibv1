import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

/** GET: Returns programme counts per category (enabled programmes only). Public. */
export async function GET() {
  try {
    const { data, error } = await supabase
      .from("audio_programmes")
      .select("category_id")
      .eq("enabled", true)
      .not("category_id", "is", null);

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const p of data ?? []) {
      const cid = p.category_id as string;
      if (cid) counts[cid] = (counts[cid] ?? 0) + 1;
    }

    return NextResponse.json(counts);
  } catch (err) {
    console.error("Counts by category error:", err);
    return NextResponse.json(
      { error: "Failed to fetch counts" },
      { status: 500 }
    );
  }
}
