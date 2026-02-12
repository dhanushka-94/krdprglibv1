import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/validations";
import { requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");

    let query = supabase
      .from("subcategories")
      .select("*, category:categories(*)")
      .order("display_order")
      .order("name");

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Subcategories GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch subcategories" },
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
    const name = body.name as string;
    const categoryId = body.category_id as string;
    const slug = body.slug || slugify(name);

    const { data, error } = await supabase
      .from("subcategories")
      .insert({
        category_id: categoryId,
        name,
        name_si: (body.name_si as string)?.trim() ?? "",
        name_ta: (body.name_ta as string)?.trim() ?? "",
        slug,
        display_order: body.display_order ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "subcategory_create",
      entityType: "subcategory",
      entityId: data.id,
      entityTitle: data.name,
      request,
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Subcategories POST:", error);
    return NextResponse.json(
      { error: "Failed to create subcategory" },
      { status: 500 }
    );
  }
}
