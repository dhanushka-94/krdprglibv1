import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth, requireAdmin } from "@/lib/auth";
import { logActivity } from "@/lib/activity-log";

export async function GET() {
  try {
    const { error: authError } = await requireAuth();
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value");

    if (error) throw error;

    const settings: Record<string, string> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({
      import_storage_enabled: settings.import_storage_enabled !== "false",
      system_name: settings.system_name ?? "Television and Farm Broadcasting Service – All Radio Programmes Library",
      logo_url: settings.logo_url ?? "",
      favicon_url: settings.favicon_url ?? "",
      footer_credits: settings.footer_credits ?? "",
      maintenance_mode: settings.maintenance_mode === "true",
    });
  } catch (error) {
    console.error("Settings GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { session, error: authError } = await requireAdmin();
    if (authError) {
      return NextResponse.json(
        { error: authError === "Forbidden" ? "Admin only" : "Unauthorized" },
        { status: authError === "Forbidden" ? 403 : 401 }
      );
    }

    const body = await request.json();
    const updates: Array<{ key: string; value: string }> = [];

    if (typeof body.import_storage_enabled === "boolean") {
      updates.push({ key: "import_storage_enabled", value: String(body.import_storage_enabled) });
    }
    if (typeof body.logo_url === "string") {
      updates.push({ key: "logo_url", value: body.logo_url.trim() });
    }
    if (typeof body.favicon_url === "string") {
      updates.push({ key: "favicon_url", value: body.favicon_url.trim() });
    }
    if (typeof body.footer_credits === "string") {
      updates.push({ key: "footer_credits", value: body.footer_credits.trim() });
    }
    if (typeof body.maintenance_mode === "boolean") {
      updates.push({ key: "maintenance_mode", value: String(body.maintenance_mode) });
    }
    if (typeof body.system_name === "string") {
      updates.push({ key: "system_name", value: body.system_name.trim() });
    }

    for (const { key, value } of updates) {
      const { error } = await supabase
        .from("site_settings")
        .upsert(
          { key, value, updated_at: new Date().toISOString() },
          { onConflict: "key" }
        );
      if (error) throw error;
    }

    if (session && updates.length > 0) {
      await logActivity({
        userId: session.userId,
        userEmail: session.email,
        userRole: session.roleName,
        action: "settings_update",
        details: updates.length ? { updated_keys: updates.map((u) => u.key) } : undefined,
        request,
      });
    }

    const { data } = await supabase
      .from("site_settings")
      .select("key, value");
    const settings: Record<string, string> = {};
    for (const row of data ?? []) {
      settings[row.key] = row.value;
    }

    return NextResponse.json({
      import_storage_enabled: settings.import_storage_enabled !== "false",
      system_name: settings.system_name ?? "Television and Farm Broadcasting Service – All Radio Programmes Library",
      logo_url: settings.logo_url ?? "",
      favicon_url: settings.favicon_url ?? "",
      footer_credits: settings.footer_credits ?? "",
      maintenance_mode: settings.maintenance_mode === "true",
    });
  } catch (error) {
    console.error("Settings PATCH:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
