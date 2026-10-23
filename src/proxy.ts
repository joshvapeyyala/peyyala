// Runs before every /admin request. A quick, optimistic check: without a
// session cookie, go to the login page. It doesn't verify the session (no
// database call here); the admin layout and every server action do that.
import { getSessionCookie } from "better-auth/cookies";
import { NextResponse, type NextRequest } from "next/server";

export function proxy(request: NextRequest) {
  if (request.nextUrl.pathname === "/admin/login" || getSessionCookie(request)) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin/login", request.url));
}

export const config = {
  matcher: ["/admin", "/admin/:path*"],
};
