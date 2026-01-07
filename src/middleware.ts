import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
    function middleware(req) {
        const token = req.nextauth.token;
        const isAuth = !!token;
        const isAuthPage =
            req.nextUrl.pathname.startsWith("/login") ||
            req.nextUrl.pathname.startsWith("/register");
        const isAdminPage = req.nextUrl.pathname.startsWith("/admin");

        // 1. Redirect to dashboard if logged in and trying to access auth pages
        if (isAuthPage && isAuth) {
            if (token?.role === "ADMIN") {
                return NextResponse.redirect(new URL("/admin/dashboard", req.url));
            }
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        // 2. Protect Admin Routes
        if (isAdminPage && token?.role !== "ADMIN") {
            // If user tries to access admin, redirect to their dashboard or 403
            return NextResponse.redirect(new URL("/dashboard", req.url));
        }

        return NextResponse.next();
    },
    {
        callbacks: {
            authorized: ({ token }) => !!token, // Requires token for everything covered by matcher
        },
    }
);

export const config = {
    // Matcher: Protect Dashboard and Admin routes.
    // Exclude static files, public images, icons, and API routes (APIs handle their own auth usually)
    matcher: ["/dashboard/:path*", "/admin/:path*"],
};
