import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { canUploadTo } from "@/lib/user-assignments";
import { logActivity } from "@/lib/activity-log";
import { getSession } from "@/lib/auth-session";
import { getSignedReadUrl } from "@/lib/firebase-admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { data, error } = await supabase
      .from("audio_programmes")
      .select("*, category:categories(*), subcategory:subcategories(*), radio_channel:radio_channels(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) return NextResponse.json(null, { status: 404 });

    // Programme Manager: may only access programmes in their assigned categories/subcategories
    const session = await getSession();
    if (session?.roleName === "Programme Manager") {
      const allowed = await canUploadTo(
        session.userId,
        session.roleName,
        data.category_id ?? null,
        data.subcategory_id ?? null
      );
      if (!allowed) {
        return NextResponse.json(
          { error: "You do not have access to this programme" },
          { status: 403 }
        );
      }
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Programme GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch programme" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session) throw new Error("No session");
    if (session.roleName === "Viewer") {
      return NextResponse.json({ error: "Viewers cannot edit programmes" }, { status: 403 });
    }
    const { id } = await params;

    const curr = await supabase.from("audio_programmes").select("category_id, subcategory_id").eq("id", id).single();
    if (curr.error || !curr.data) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }

    // Programme Manager: may only edit programmes in their assigned categories/subcategories
    const allowedForProgramme = await canUploadTo(
      session.userId,
      session.roleName,
      curr.data.category_id ?? null,
      curr.data.subcategory_id ?? null
    );
    if (!allowedForProgramme) {
      return NextResponse.json(
        { error: "You do not have access to edit this programme" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const catId = body.category_id !== undefined ? body.category_id : null;
    const subId = body.subcategory_id !== undefined ? body.subcategory_id : null;
    if (catId !== undefined || subId !== undefined) {
      const cid = catId ?? curr.data.category_id ?? null;
      const sid = subId ?? curr.data.subcategory_id ?? null;
      const allowedForTarget = await canUploadTo(session.userId, session.roleName, cid, sid);
      if (!allowedForTarget) {
        return NextResponse.json({ error: "You can only assign to your assigned categories or subcategories" }, { status: 403 });
      }
    }
    const updates: {
      title?: string;
      slug?: string;
      broadcasted_date?: string;
      repeat_broadcasted_date?: string | null;
      description?: string | null;
      category_id?: string | null;
      subcategory_id?: string | null;
      radio_channel_id?: string | null;
      firebase_storage_url?: string;
      firebase_storage_path?: string;
      file_size_bytes?: number | null;
      seo_title?: string | null;
      seo_description?: string | null;
      seo_keywords?: string | null;
    } = {};

    if (body.title !== undefined) {
      updates.title = body.title;
      const newSlug = body.slug || slugify(body.title);
      if (newSlug) updates.slug = newSlug;
    }
    if (body.broadcasted_date !== undefined) updates.broadcasted_date = body.broadcasted_date;
    if (body.repeat_broadcasted_date !== undefined) updates.repeat_broadcasted_date = body.repeat_broadcasted_date;
    if (body.description !== undefined) updates.description = body.description;
    if (body.category_id !== undefined) updates.category_id = body.category_id;
    if (body.subcategory_id !== undefined) updates.subcategory_id = body.subcategory_id;
    if (body.radio_channel_id !== undefined) updates.radio_channel_id = body.radio_channel_id;
    if (body.firebase_storage_path !== undefined) updates.firebase_storage_path = body.firebase_storage_path;
    if (body.firebase_storage_url !== undefined) updates.firebase_storage_url = body.firebase_storage_url;
    else if (body.firebase_storage_path) {
      const url = await getSignedReadUrl(body.firebase_storage_path);
      if (url) updates.firebase_storage_url = url;
    }
    if (body.file_size_bytes !== undefined) updates.file_size_bytes = body.file_size_bytes;
    if (body.seo_title !== undefined) updates.seo_title = body.seo_title;
    if (body.seo_description !== undefined) updates.seo_description = body.seo_description;
    if (body.seo_keywords !== undefined) updates.seo_keywords = body.seo_keywords;

    const { data, error } = await supabase
      .from("audio_programmes")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "programme_update",
      entityType: "programme",
      entityId: id,
      entityTitle: data.title,
      details: body.firebase_storage_path ? { audio_replaced: true } : undefined,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Programme PATCH:", error);
    return NextResponse.json(
      { error: "Failed to update programme" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.roleName === "Viewer") {
      return NextResponse.json({ error: "Viewers cannot delete programmes" }, { status: 403 });
    }
    const { id } = await params;

    const { data: programme } = await supabase
      .from("audio_programmes")
      .select("firebase_storage_path, title, category_id, subcategory_id")
      .eq("id", id)
      .single();

    if (!programme) {
      return NextResponse.json({ error: "Programme not found" }, { status: 404 });
    }

    // Programme Manager: may only delete programmes in their assigned categories/subcategories
    const allowed = await canUploadTo(
      session.userId,
      session.roleName,
      programme.category_id ?? null,
      programme.subcategory_id ?? null
    );
    if (!allowed) {
      return NextResponse.json(
        { error: "You do not have access to delete this programme" },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("audio_programmes")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    if (session) {
      await logActivity({
        userId: session.userId,
        userEmail: session.email,
        userRole: session.roleName,
        action: "programme_delete",
        entityType: "programme",
        entityId: id,
        entityTitle: programme?.title ?? undefined,
        request,
      });
    }

    return NextResponse.json({
      success: true,
      firebase_storage_path: programme?.firebase_storage_path,
    });
  } catch (error) {
    console.error("Programme DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete programme" },
      { status: 500 }
    );
  }
}
