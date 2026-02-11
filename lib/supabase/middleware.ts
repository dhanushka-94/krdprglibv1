import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth-session";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === "/admin" || pathname.startsWith("/admin/");
  const isLoginPage = pathname === "/login";

  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;

  if (isAdminRoute && !session && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginPage && session) {
    const redirect = request.nextUrl.searchParams.get("redirect") ?? "/admin";
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  return response;
}
