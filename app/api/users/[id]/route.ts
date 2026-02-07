import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth-session";
import { getUserAssignments } from "@/lib/user-assignments";
import { logActivity } from "@/lib/activity-log";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, phone, company, unit, avatar_url, bio, role_id, is_active, created_at, updated_at, role:roles(id, name, description)")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (session.roleName !== "Admin" && session.userId !== id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const [catRes, subRes] = await Promise.all([
      supabase.from("user_category_assignments").select("category_id").eq("user_id", id),
      supabase.from("user_subcategory_assignments").select("subcategory_id").eq("user_id", id),
    ]);
    const category_ids = (catRes.data ?? []).map((r) => r.category_id);
    const subcategory_ids = (subRes.data ?? []).map((r) => r.subcategory_id);
    return NextResponse.json({ ...data, category_ids, subcategory_ids });
  } catch (err) {
    console.error("User GET:", err);
    return NextResponse.json(
      { error: "Failed to fetch user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const isAdmin = session.roleName === "Admin";
    const isSelf = session.userId === id;

    if (!isAdmin && !isSelf) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updates: Record<string, unknown> = {};

    if (body.name !== undefined) updates.name = body.name;
    if (body.phone !== undefined) updates.phone = body.phone;
    if (body.company !== undefined) updates.company = body.company;
    if (body.unit !== undefined) updates.unit = body.unit;
    if (body.avatar_url !== undefined) updates.avatar_url = body.avatar_url;
    if (body.bio !== undefined) updates.bio = body.bio;
    if (body.email !== undefined && isAdmin) updates.email = body.email.toLowerCase().trim();
    if (body.role_id !== undefined && isAdmin) updates.role_id = body.role_id;
    if (body.is_active !== undefined && isAdmin) updates.is_active = body.is_active;

    if (body.password && body.password.trim() && (isAdmin || isSelf)) {
      updates.password_hash = await bcrypt.hash(body.password.trim(), 12);
    }

    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", id)
      .select("id, email, name, phone, company, unit, avatar_url, bio, role_id, is_active, created_at, updated_at, role:roles(id, name)")
      .single();

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "user_update",
      entityType: "user",
      entityId: id,
      entityTitle: data.email,
      request,
    });

    if (isAdmin && (body.category_ids !== undefined || body.subcategory_ids !== undefined)) {
      await supabase.from("user_category_assignments").delete().eq("user_id", id);
      await supabase.from("user_subcategory_assignments").delete().eq("user_id", id);
      const catIds = Array.isArray(body.category_ids) ? body.category_ids.filter(Boolean) : [];
      const subIds = Array.isArray(body.subcategory_ids) ? body.subcategory_ids.filter(Boolean) : [];
      if (catIds.length) {
        await supabase.from("user_category_assignments").insert(catIds.map((cid: string) => ({ user_id: id, category_id: cid })));
      }
      if (subIds.length) {
        await supabase.from("user_subcategory_assignments").insert(subIds.map((sid: string) => ({ user_id: id, subcategory_id: sid })));
      }
    }

    const { categoryIds, subcategoryIds } = await getUserAssignments(id);
    return NextResponse.json({ ...data, category_ids: categoryIds, subcategory_ids: subcategoryIds });
  } catch (err) {
    console.error("User PATCH:", err);
    return NextResponse.json(
      { error: "Failed to update user" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.roleName !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;

    const { data: deletedUser } = await supabase.from("users").select("email").eq("id", id).single();

    if (session.userId === id) {
      return NextResponse.json(
        { error: "Cannot delete your own account" },
        { status: 400 }
      );
    }

    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "user_delete",
      entityType: "user",
      entityId: id,
      entityTitle: deletedUser?.email ?? undefined,
      request,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("User DELETE:", err);
    return NextResponse.json(
      { error: "Failed to delete user" },
      { status: 500 }
    );
  }
}
