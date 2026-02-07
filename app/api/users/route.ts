import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";
import { getSession } from "@/lib/auth-session";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.roleName !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabase
      .from("users")
      .select("id, email, name, phone, company, unit, avatar_url, bio, role_id, is_active, created_at, updated_at, role:roles(id, name)")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return NextResponse.json(data);
  } catch (err) {
    console.error("Users GET:", err);
    return NextResponse.json(
      { error: "Failed to fetch users" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (session.roleName !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const {
      email,
      password,
      name,
      phone,
      company,
      unit,
      avatar_url,
      bio,
      role_id,
      is_active = true,
      category_ids = [],
      subcategory_ids = [],
    } = body;

    if (!email || !password || !role_id) {
      return NextResponse.json(
        { error: "Email, password, and role are required" },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(password, 12);

    const { data, error } = await supabase
      .from("users")
      .insert({
        email: email.toLowerCase().trim(),
        password_hash,
        role_id,
        name: name || null,
        phone: phone || null,
        company: company || null,
        unit: unit || null,
        avatar_url: avatar_url || null,
        bio: bio || null,
        is_active: !!is_active,
      })
      .select("id, email, name, phone, company, unit, avatar_url, bio, role_id, is_active, created_at, role:roles(id, name)")
      .single();

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { error: "Email already exists" },
          { status: 400 }
        );
      }
      throw error;
    }

    const uid = data.id;
    const catIds = Array.isArray(category_ids) ? category_ids.filter(Boolean) : [];
    const subIds = Array.isArray(subcategory_ids) ? subcategory_ids.filter(Boolean) : [];
    if (catIds.length) {
      await supabase.from("user_category_assignments").insert(catIds.map((cid: string) => ({ user_id: uid, category_id: cid })));
    }
    if (subIds.length) {
      await supabase.from("user_subcategory_assignments").insert(subIds.map((sid: string) => ({ user_id: uid, subcategory_id: sid })));
    }

    const r = data.role as { name: string } | { name: string }[] | null;
    const roleName = Array.isArray(r) ? r[0]?.name : r?.name;

    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "user_create",
      entityType: "user",
      entityId: data.id,
      entityTitle: data.email,
      details: { role: roleName },
      request,
    });

    return NextResponse.json(data);
  } catch (err) {
    console.error("Users POST:", err);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}
