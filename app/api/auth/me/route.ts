import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth-session";
import { supabase } from "@/lib/supabase";
import { getUserAssignments } from "@/lib/user-assignments";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const { data: user, error } = await supabase
    .from("users")
    .select("id, email, name, phone, company, unit, avatar_url, bio, role_id, is_active, created_at, role:roles(id, name, description)")
    .eq("id", session.userId)
    .single();

  if (error || !user) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  const r = user.role as { name: string } | { name: string }[] | null;
  const roleName = Array.isArray(r) ? r[0]?.name : r?.name;
  const role = roleName ?? session.roleName;

  let assigned_category_ids: string[] = [];
  let assigned_subcategory_ids: string[] = [];
  if (role === "Programme Manager") {
    const a = await getUserAssignments(session.userId);
    assigned_category_ids = a.categoryIds;
    assigned_subcategory_ids = a.subcategoryIds;
  }

  return NextResponse.json({
    user: {
      ...user,
      role,
      assigned_category_ids,
      assigned_subcategory_ids,
    },
  });
}
