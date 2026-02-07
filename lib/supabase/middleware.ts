import { NextResponse, type NextRequest } from "next/server";
import { verifyToken, getTokenFromRequest } from "@/lib/auth-session";

export async function updateSession(request: NextRequest) {
  const response = NextResponse.next({ request });

  const adminPath = process.env.NEXT_PUBLIC_ADMIN_PATH ?? "k7x9p2";
  const adminPrefix = `/${adminPath}`;
  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname === adminPrefix || pathname.startsWith(adminPrefix + "/");
  const isDirectAdminRoute = pathname.startsWith("/admin");
  const isLoginPage = pathname === "/login";

  const token = getTokenFromRequest(request);
  const session = token ? await verifyToken(token) : null;

  if (isDirectAdminRoute) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAdminRoute && !session && !isLoginPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  if (isLoginPage && session) {
    const redirect = request.nextUrl.searchParams.get("redirect") ?? adminPrefix;
    return NextResponse.redirect(new URL(redirect, request.url));
  }

  return response;
}
