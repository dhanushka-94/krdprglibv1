import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { data, error } = await supabase
      .from("audio_programmes")
      .select("*, category:categories(*, radio_channel:radio_channels(*)), subcategory:subcategories(*)")
      .eq("slug", slug)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Programme by slug GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch programme" },
      { status: 500 }
    );
  }
}
