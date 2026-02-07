import { NextResponse } from "next/server";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { supabase } from "@/lib/supabase";

/** Set new password using a valid reset token (from forgot-password). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = (body.token as string)?.trim();
    const newPassword = (body.newPassword as string)?.trim();

    if (!token || !newPassword) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      );
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const now = new Date().toISOString();

    const { data: row, error: fetchError } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id")
      .eq("token_hash", tokenHash)
      .gte("expires_at", now)
      .limit(1)
      .single();

    if (fetchError || !row) {
      return NextResponse.json(
        { error: "Invalid or expired reset link. Please request a new one." },
        { status: 400 }
      );
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    const { error: updateError } = await supabase
      .from("users")
      .update({ password_hash })
      .eq("id", row.user_id);

    if (updateError) throw updateError;

    await supabase.from("password_reset_tokens").delete().eq("id", row.id);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Reset password:", err);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
}
