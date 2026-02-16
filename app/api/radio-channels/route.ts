import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("radio_channels")
      .select("*")
      .order("display_order")
      .order("name");

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Radio channels GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch radio channels" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session, error: authError } = await requireAdmin();
    if (authError) {
      return NextResponse.json(
        { error: authError === "Forbidden" ? "Admin only" : "Unauthorized" },
        { status: authError === "Forbidden" ? 403 : 401 }
      );
    }
    if (!session) throw new Error("No session");
    const body = await request.json();
    const name = (body.name as string)?.trim();
    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("radio_channels")
      .insert({
        name,
        frequency: (body.frequency as string)?.trim() || null,
        frequency_2: (body.frequency_2 as string)?.trim() || null,
        logo_url: (body.logo_url as string)?.trim() || null,
        stream_url: (body.stream_url as string)?.trim() || null,
        description: (body.description as string)?.trim() || null,
        display_order: body.display_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "radio_channel_create",
      entityType: "radio_channel",
      entityId: data.id,
      entityTitle: data.name,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Radio channels POST:", error);
    return NextResponse.json(
      { error: "Failed to create radio channel" },
      { status: 500 }
    );
  }
}
