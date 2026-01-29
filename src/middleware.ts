import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = (token as any)?.role;
    const path = req.nextUrl.pathname;

    // Protect Vendor Routes
    if (path.startsWith("/vendor") && role !== "vendor") {
      return NextResponse.redirect(new URL("/trips", req.url));
    }

    // Protect Admin Routes
    if (path.startsWith("/admin") && role !== "admin") {
      return NextResponse.redirect(new URL("/trips", req.url));
    }
    
    // Protect Traveler Routes (optional, but good practice)
    if (path.startsWith("/trips") && role === "vendor") {
        return NextResponse.redirect(new URL("/vendor/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token
    }
  }
);

export const config = {
  matcher: [
    "/trips/:path*",
    "/vendor/:path*",
    "/admin/:path*",
    "/settings/:path*"
  ]
};
