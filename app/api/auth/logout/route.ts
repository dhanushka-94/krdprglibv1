import { NextResponse } from "next/server";
import { getSession, deleteSessionCookie } from "@/lib/auth-session";
import { logActivity } from "@/lib/activity-log";

export async function POST(request: Request) {
  const session = await getSession();
  if (session) {
    await logActivity({
      userId: session.userId,
      userEmail: session.email,
      userRole: session.roleName,
      action: "logout",
      request,
    });
  }
  await deleteSessionCookie();
  return NextResponse.json({ success: true });
}
