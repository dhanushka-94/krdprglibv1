import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { createToken, setSessionCookie } from "@/lib/auth-session";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password required" },
        { status: 400 }
      );
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("id, email, password_hash, role_id, role:roles(id, name)")
      .eq("email", email.toLowerCase().trim())
      .eq("is_active", true)
      .single();

    if (error || !user) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (!user.password_hash || typeof user.password_hash !== "string") {
      return NextResponse.json(
        { error: "Account has no password set. Use create-admin script or contact admin." },
        { status: 401 }
      );
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const r = user.role as { id: string; name: string } | { id: string; name: string }[] | null;
    const role = Array.isArray(r) ? r[0] ?? null : r;
    const token = await createToken({
      userId: user.id,
      email: user.email,
      roleId: user.role_id,
      roleName: role?.name ?? "Viewer",
    });

    await setSessionCookie(token);

    await logActivity({
      userId: user.id,
      userEmail: user.email,
      userRole: role?.name ?? "Viewer",
      action: "login",
      request,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        role: role?.name ?? "Viewer",
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json(
      { error: "Login failed" },
      { status: 500 }
    );
  }
}
