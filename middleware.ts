import type { NextRequest } from "next/server"
import { NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next()
  response.headers.set("X-Content-Type-Options", "nosniff")
  response.headers.set("X-Frame-Options", "DENY")
  response.headers.set("X-XSS-Protection", "1; mode=block")
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin")
  response.headers.set("Permissions-Policy", "geolocation=(), microphone=(), camera=()")

  const authToken = request.cookies.get("auth_token")?.value
  const dashboardType = request.cookies.get("dashboard_type")?.value
  const pathname = request.nextUrl.pathname

  // Not logged in → redirect to login
  if (!authToken) {
    if (pathname.startsWith("/dashboard") || pathname.startsWith("/team-dashboard")) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return response
  }

  // Restrict access based on dashboard_type cookie
  if (dashboardType === "main" && pathname.startsWith("/team-dashboard")) {
    return NextResponse.redirect(new URL("/dashboard", request.url))
  }
  if (dashboardType === "team" && pathname.startsWith("/dashboard")) {
    return NextResponse.redirect(new URL("/team-dashboard", request.url))
  }

  return response
}

export const config = {
  matcher: ["/dashboard/:path*", "/team-dashboard/:path*"],
}
