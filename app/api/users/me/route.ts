import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth-session";

/** Current user's profile + stats (programmes uploaded, recent activity). */
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

    const [countRes, activityRes] = await Promise.all([
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
    ]);

    const role = user.role as { id: string; name: string } | { id: string; name: string }[] | null;
    const roleName = Array.isArray(role) ? role[0]?.name : role?.name;

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
    });
  } catch (err) {
    console.error("Users me GET:", err);
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 500 }
    );
  }
}
