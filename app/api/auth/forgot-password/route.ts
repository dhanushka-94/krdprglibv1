import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabase } from "@/lib/supabase";

const RESET_EXPIRY_HOURS = 1;

/** Request a password reset. Creates a token and returns the reset link (no email service). */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const email = (body.email as string)?.toLowerCase()?.trim();
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: "No active account found with this email." },
        { status: 404 }
      );
    }

    const token = crypto.randomBytes(32).toString("base64url");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_EXPIRY_HOURS * 60 * 60 * 1000).toISOString();

    await supabase.from("password_reset_tokens").delete().eq("user_id", user.id);
    const { error: insertError } = await supabase.from("password_reset_tokens").insert({
      user_id: user.id,
      token_hash: tokenHash,
      expires_at: expiresAt,
    });

    if (insertError) {
      console.error("Forgot password insert:", insertError);
      return NextResponse.json(
        { error: "Failed to create reset link. Please try again." },
        { status: 500 }
      );
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");
    const resetLink = `${baseUrl}/login/reset-password?token=${token}`;

    return NextResponse.json({ message: "Use the link below to set a new password.", resetLink });
  } catch (err) {
    console.error("Forgot password:", err);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}
