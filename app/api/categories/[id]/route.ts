import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("categories")
      .select("*, radio_channel:radio_channels(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json(null, { status: 404 });
    return NextResponse.json(data);
  } catch (error) {
    console.error("Category GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch category" },
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
    const updates: { name?: string; slug?: string; display_order?: number; radio_channel_id?: string | null } = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.slug !== undefined) updates.slug = body.slug;
    else if (body.name) updates.slug = slugify(body.name);
    if (body.display_order !== undefined) updates.display_order = body.display_order;
    if (body.radio_channel_id !== undefined) updates.radio_channel_id = body.radio_channel_id || null;

    const { data, error } = await supabase
      .from("categories")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "category_update",
      entityType: "category",
      entityId: id,
      entityTitle: data.name,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Category PATCH:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
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
    const { data: cat } = await supabase.from("categories").select("name").eq("id", id).single();
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "category_delete",
      entityType: "category",
      entityId: id,
      entityTitle: cat?.name ?? undefined,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Category DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
}
