import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAuth } from "@/lib/auth";

export async function GET(request: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 200);
    const offset = Math.max(0, parseInt(searchParams.get("offset") || "0", 10));
    const userId = searchParams.get("user_id");
    const action = searchParams.get("action");
    const entityType = searchParams.get("entity_type");
    const dateFrom = searchParams.get("date_from");
    const dateTo = searchParams.get("date_to");
    const report = searchParams.get("report") === "true";
    if (report && session?.roleName !== "Admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const reportLimit = report ? Math.min(5000, parseInt(searchParams.get("report_limit") || "1000", 10)) : limit;

    let query = supabase
      .from("activity_logs")
      .select("*")
      .order("created_at", { ascending: false });

    if (report) {
      query = query.range(0, reportLimit - 1);
    } else {
      query = query.range(offset, offset + limit - 1);
    }
    if (userId) query = query.eq("user_id", userId);
    if (action) query = query.eq("action", action);
    if (entityType) query = query.eq("entity_type", entityType);
    if (dateFrom) query = query.gte("created_at", `${dateFrom}T00:00:00.000Z`);
    if (dateTo) query = query.lte("created_at", `${dateTo}T23:59:59.999Z`);

    const { data, error } = await query;

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Activity logs GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch activity logs" },
      { status: 500 }
    );
  }
}
