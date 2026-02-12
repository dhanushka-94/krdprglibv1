import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("radio_channels")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Radio channel GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch radio channel" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAdmin();
    if (authError) {
      return NextResponse.json(
        { error: authError === "Forbidden" ? "Admin only" : "Unauthorized" },
        { status: authError === "Forbidden" ? 403 : 401 }
      );
    }
    if (!session) throw new Error("No session");
    const { id } = await params;
    const body = await request.json();
    const updates: { name?: string; name_si?: string; name_ta?: string; frequency?: string | null; frequency_2?: string | null; logo_url?: string | null; display_order?: number } = {};

    if (body.name !== undefined) updates.name = (body.name as string)?.trim();
    if (body.name_si !== undefined) updates.name_si = (body.name_si as string)?.trim() ?? "";
    if (body.name_ta !== undefined) updates.name_ta = (body.name_ta as string)?.trim() ?? "";
    if (body.frequency !== undefined) updates.frequency = (body.frequency as string)?.trim() || null;
    if (body.frequency_2 !== undefined) updates.frequency_2 = (body.frequency_2 as string)?.trim() || null;
    if (body.logo_url !== undefined) updates.logo_url = (body.logo_url as string)?.trim() || null;
    if (body.display_order !== undefined) updates.display_order = body.display_order;

    const { data, error } = await supabase
      .from("radio_channels")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "radio_channel_update",
      entityType: "radio_channel",
      entityId: id,
      entityTitle: data.name,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Radio channel PATCH:", error);
    return NextResponse.json(
      { error: "Failed to update radio channel" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAdmin();
    if (authError) {
      return NextResponse.json(
        { error: authError === "Forbidden" ? "Admin only" : "Unauthorized" },
        { status: authError === "Forbidden" ? 403 : 401 }
      );
    }
    if (!session) throw new Error("No session");
    const { id } = await params;
    const { data: channel } = await supabase.from("radio_channels").select("name").eq("id", id).single();
    const { error } = await supabase.from("radio_channels").delete().eq("id", id);

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "radio_channel_delete",
      entityType: "radio_channel",
      entityId: id,
      entityTitle: channel?.name ?? undefined,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Radio channel DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete radio channel" },
      { status: 500 }
    );
  }
}
