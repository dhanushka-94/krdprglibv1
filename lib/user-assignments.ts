import { supabase } from "@/lib/supabase";

/** Check if Programme Manager can upload to given category/subcategory. Admins always allowed. */
export async function canUploadTo(
  userId: string,
  roleName: string,
  categoryId: string | null,
  subcategoryId: string | null
): Promise<boolean> {
  if (roleName === "Admin") return true;
  if (roleName === "Viewer") return false;
  if (roleName !== "Programme Manager") return false;

  // Programme Manager: must have category or subcategory assigned
  if (categoryId) {
    const { data: cat } = await supabase
      .from("user_category_assignments")
      .select("user_id")
      .eq("user_id", userId)
      .eq("category_id", categoryId)
      .single();
    if (cat) return true;
  }
  if (subcategoryId) {
    const { data: sub } = await supabase
      .from("user_subcategory_assignments")
      .select("user_id")
      .eq("user_id", userId)
      .eq("subcategory_id", subcategoryId)
      .single();
    if (sub) return true;
  }
  return false;
}

/** Fetch assigned category_ids and subcategory_ids for a user */
export async function getUserAssignments(userId: string) {
  const [catRes, subRes] = await Promise.all([
    supabase.from("user_category_assignments").select("category_id").eq("user_id", userId),
    supabase.from("user_subcategory_assignments").select("subcategory_id").eq("user_id", userId),
  ]);
  const categoryIds = (catRes.data ?? []).map((r) => r.category_id);
  const subcategoryIds = (subRes.data ?? []).map((r) => r.subcategory_id);
  return { categoryIds, subcategoryIds };
}
