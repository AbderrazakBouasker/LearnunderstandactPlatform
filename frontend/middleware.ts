import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const token = req.cookies.get("jwt")?.value; // Read JWT from cookies
  const { pathname } = req.nextUrl;

  // Exclude the login page from protection
  if (pathname === "/admin/login" || pathname === "/admin/register") {
    return NextResponse.next(); // Allow access to login page
  }

  // Define protected routes (everything inside /admin except /admin/login)
  if (pathname.startsWith("/admin") && !token) {
    return NextResponse.redirect(new URL("/admin/login", req.url)); // Redirect to home if no token
  }

  return NextResponse.next(); // Allow access if authenticated
}

// Apply middleware to all /admin routes except /admin/login
export const config = {
  matcher: ["/admin/:path*"], // Protect everything inside /admin
};
