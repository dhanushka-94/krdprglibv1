import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/validations";
import { requireAuth } from "@/lib/auth";
import { canUploadTo, getUserAssignments } from "@/lib/user-assignments";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");
    const subcategoryId = searchParams.get("subcategory_id");
    const radioChannelId = searchParams.get("radio_channel_id");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const search = searchParams.get("search")?.trim();
    const createdByMe = searchParams.get("created_by") === "me";

    let query = supabase
      .from("audio_programmes")
      .select("*, category:categories(*), subcategory:subcategories(*), radio_channel:radio_channels(*)")
      .order("broadcasted_date", { ascending: false, nullsFirst: false });

    // Programme Manager: restrict to assigned categories/subcategories only
    const { getSession } = await import("@/lib/auth-session");
    const session = await getSession();
    if (session?.roleName === "Programme Manager") {
      const { categoryIds, subcategoryIds } = await getUserAssignments(session.userId);
      if (categoryIds.length === 0 && subcategoryIds.length === 0) {
        return NextResponse.json([]);
      }
      const orParts: string[] = [];
      if (categoryIds.length > 0) orParts.push(`category_id.in.(${categoryIds.join(",")})`);
      if (subcategoryIds.length > 0) orParts.push(`subcategory_id.in.(${subcategoryIds.join(",")})`);
      query = query.or(orParts.join(","));
    }

    if (createdByMe) {
      if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      query = query.eq("created_by_user_id", session.userId);
    }
    if (categoryId) query = query.eq("category_id", categoryId);
    if (subcategoryId) query = query.eq("subcategory_id", subcategoryId);
    if (radioChannelId) query = query.eq("radio_channel_id", radioChannelId);
    if (dateFrom) query = query.gte("broadcasted_date", dateFrom);
    if (dateTo) query = query.lte("broadcasted_date", dateTo);
    if (search) {
      const safeSearch = search.replace(/,/g, " ").trim();
      if (safeSearch) {
        const pattern = `%${safeSearch}%`;
        query = query.or(
          `title.ilike.${pattern},description.ilike.${pattern},seo_title.ilike.${pattern},seo_keywords.ilike.${pattern}`
        );
      }
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Programmes GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch programmes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (!session) throw new Error("No session");
    if (session.roleName === "Viewer") {
      return NextResponse.json({ error: "Viewers cannot upload programmes" }, { status: 403 });
    }
    const body = await request.json();
    const allowed = await canUploadTo(
      session.userId,
      session.roleName,
      body.category_id ?? null,
      body.subcategory_id ?? null
    );
    if (!allowed) {
      return NextResponse.json({ error: "You can only upload to assigned categories or subcategories" }, { status: 403 });
    }
    const title = body.title as string;
    const rawSlug = body.slug || slugify(title);
    const slug = rawSlug || `p-${Date.now().toString(36)}`;

    const { data, error } = await supabase
      .from("audio_programmes")
      .insert({
        title,
        slug,
        broadcasted_date: body.broadcasted_date,
        repeat_broadcasted_date: body.repeat_broadcasted_date || null,
        description: body.description || null,
        category_id: body.category_id || null,
        subcategory_id: body.subcategory_id || null,
        radio_channel_id: body.radio_channel_id || null,
        firebase_storage_url: body.firebase_storage_url,
        firebase_storage_path: body.firebase_storage_path,
        file_size_bytes: body.file_size_bytes ?? null,
        duration_seconds: body.duration_seconds ?? null,
        seo_title: body.seo_title || null,
        seo_description: body.seo_description || null,
        seo_keywords: body.seo_keywords || null,
        created_by_user_id: session.userId,
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "programme_create",
      entityType: "programme",
      entityId: data.id,
      entityTitle: data.title,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Programmes POST:", error);
    return NextResponse.json(
      { error: "Failed to create programme" },
      { status: 500 }
    );
  }
}
