import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

/** GET /api/reports/users - Admin only. Returns users with programme and activity counts. */
export async function GET() {
  try {
    const { error: authError } = await requireAdmin();
    if (authError) {
      return NextResponse.json(
        { error: authError === "Forbidden" ? "Admin only" : "Unauthorized" },
        { status: authError === "Forbidden" ? 403 : 401 }
      );
    }

    const { data: users, error: usersError } = await supabase
      .from("users")
      .select("id, email, name, role_id, is_active, created_at, role:roles(id, name)")
      .order("created_at", { ascending: false });

    if (usersError) throw usersError;
    if (!users || users.length === 0) {
      return NextResponse.json([]);
    }

    const userIds = users.map((u) => u.id);

    const [progRes, activityRes] = await Promise.all([
      supabase
        .from("audio_programmes")
        .select("created_by_user_id")
        .in("created_by_user_id", userIds),
      supabase
        .from("activity_logs")
        .select("user_id")
        .in("user_id", userIds),
    ]);

    const progByUser: Record<string, number> = {};
    const activityByUser: Record<string, number> = {};
    userIds.forEach((id) => {
      progByUser[id] = 0;
      activityByUser[id] = 0;
    });
    (progRes.data ?? []).forEach((r) => {
      if (r.created_by_user_id) progByUser[r.created_by_user_id] = (progByUser[r.created_by_user_id] ?? 0) + 1;
    });
    (activityRes.data ?? []).forEach((r) => {
      if (r.user_id) activityByUser[r.user_id] = (activityByUser[r.user_id] ?? 0) + 1;
    });

    const result = users.map((u) => {
      const role = u.role as { name: string } | { name: string }[] | null;
      const roleName = Array.isArray(role) ? role[0]?.name : role?.name;
      return {
        id: u.id,
        email: u.email,
        name: u.name ?? null,
        role: roleName ?? "—",
        is_active: u.is_active,
        created_at: u.created_at,
        programmes_uploaded: progByUser[u.id] ?? 0,
        activity_count: activityByUser[u.id] ?? 0,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Reports users GET:", err);
    return NextResponse.json(
      { error: "Failed to fetch users report" },
      { status: 500 }
    );
  }
}
