import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { requireAdmin } from "@/lib/auth";

/** GET: list schedules. Public. Query: category_id, radio_channel_id, day_of_week (0-6), is_daily */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get("category_id");
    const radioChannelId = searchParams.get("radio_channel_id");
    const dayOfWeek = searchParams.get("day_of_week");
    const isDaily = searchParams.get("is_daily");

    let q = supabase
      .from("category_schedules")
      .select("*, category:categories(id, name, slug), radio_channel:radio_channels(id, name, frequency, frequency_2, logo_url)")
      .order("display_order")
      .order("start_time");

    if (categoryId) q = q.eq("category_id", categoryId);
    if (radioChannelId) q = q.eq("radio_channel_id", radioChannelId);
    if (dayOfWeek !== null && dayOfWeek !== "") {
      const d = parseInt(dayOfWeek, 10);
      if (Number.isInteger(d) && d >= 0 && d <= 6) {
        q = q.or(`day_of_week.eq.${d},is_daily.eq.true`);
      }
    }
    if (isDaily === "true") q = q.eq("is_daily", true);

    const { data, error } = await q;

    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    console.error("Category schedules GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch schedules" },
      { status: 500 }
    );
  }
}

/** POST: create schedule. Admin only. */
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
    const categoryId = body.category_id as string;
    const radioChannelId = body.radio_channel_id as string;
    const startTime = (body.start_time as string)?.trim();
    const endTime = (body.end_time as string)?.trim();
    const isDaily = !!body.is_daily;
    const dayOfWeek = isDaily ? null : (body.day_of_week as number | null);

    if (!categoryId || !radioChannelId || !startTime || !endTime) {
      return NextResponse.json(
        { error: "category_id, radio_channel_id, start_time, end_time are required" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("category_schedules")
      .insert({
        category_id: categoryId,
        radio_channel_id: radioChannelId,
        day_of_week: isDaily ? null : (dayOfWeek ?? null),
        start_time: startTime,
        end_time: endTime,
        is_daily: isDaily,
        display_order: body.display_order ?? 0,
      })
      .select("*, category:categories(id, name), radio_channel:radio_channels(id, name)")
      .single();

    if (error) throw error;
    return NextResponse.json(data);
  } catch (error) {
    console.error("Category schedules POST:", error);
    return NextResponse.json(
      { error: "Failed to create schedule" },
      { status: 500 }
    );
  }
}
