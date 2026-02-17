import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth-session";
import { getUserAssignments } from "@/lib/user-assignments";

/** Get category-wise programme counts for Programme Manager's accessible categories */
async function getCategoryWiseCounts(userId: string): Promise<{ category_id: string; category_name: string; count: number }[]> {
  const { categoryIds, subcategoryIds } = await getUserAssignments(userId);

  const accessibleCategoryIds = new Set<string>(categoryIds);

  if (subcategoryIds.length > 0) {
    const { data: subs } = await supabase
      .from("subcategories")
      .select("category_id")
      .in("id", subcategoryIds);
    (subs ?? []).forEach((s) => accessibleCategoryIds.add(s.category_id));
  }

  if (accessibleCategoryIds.size === 0) return [];

  const { data: categories } = await supabase
    .from("categories")
    .select("id, name")
    .in("id", Array.from(accessibleCategoryIds));

  const result: { category_id: string; category_name: string; count: number }[] = [];
  for (const cat of categories ?? []) {
    const { count } = await supabase
      .from("audio_programmes")
      .select("id", { count: "exact", head: true })
      .eq("category_id", cat.id)
      .eq("enabled", true);
    result.push({
      category_id: cat.id,
      category_name: cat.name,
      count: count ?? 0,
    });
  }
  result.sort((a, b) => a.category_name.localeCompare(b.category_name));
  return result;
}

/** Current user's profile + stats (programmes uploaded, recent activity, category-wise counts for Programme Managers). */
export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, name, phone, avatar_url, bio, role_id, created_at, role:roles(id, name, description)")
      .eq("id", session.userId)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const role = user.role as { id: string; name: string } | { id: string; name: string }[] | null;
    const roleName = Array.isArray(role) ? role[0]?.name : role?.name;

    const [countRes, activityRes, categoryWiseCounts] = await Promise.all([
      supabase
        .from("audio_programmes")
        .select("id", { count: "exact", head: true })
        .eq("created_by_user_id", session.userId),
      supabase
        .from("activity_logs")
        .select("id, action, entity_type, entity_title, created_at")
        .eq("user_id", session.userId)
        .order("created_at", { ascending: false })
        .limit(15),
      roleName === "Programme Manager" ? getCategoryWiseCounts(session.userId) : Promise.resolve([]),
    ]);

    return NextResponse.json({
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        avatar_url: user.avatar_url,
        bio: user.bio,
        role: roleName,
        created_at: user.created_at,
      },
      programmes_uploaded_count: countRes.count ?? 0,
      recent_activity: activityRes.data ?? [],
      category_wise_counts: categoryWiseCounts,
    });
  } catch (err) {
    console.error("Users me GET:", err);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
