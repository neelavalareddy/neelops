import { NextRequest, NextResponse } from "next/server";
import { getEdgeSessionCookieName, parseSessionTokenEdge } from "@/lib/auth/session-edge";

const PUBLIC_PAGE_PATHS = new Set([
  "/",
  "/login",
  "/agents",
  "/tasks",
  "/posted",
]);
const PUBLIC_API_PREFIXES = [
  "/api/verify",
  "/api/auth/me",
  "/api/auth/logout",
  "/api/auth/god-mode",
  "/api/worldid/rp-context",
];
function isPublicAsset(pathname: string): boolean {
  return (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/icon") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".gif") ||
    pathname.endsWith(".webp")
  );
}

function isPublicApi(pathname: string): boolean {
  return PUBLIC_API_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

function isPublicPage(pathname: string): boolean {
  return (
    PUBLIC_PAGE_PATHS.has(pathname) ||
    /^\/agents\/[^/]+$/.test(pathname) ||
    /^\/tasks\/[^/]+$/.test(pathname) ||
    /^\/agents\/[^/]+\/report$/.test(pathname)
  );
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const secret = process.env.AUTH_SESSION_SECRET?.trim();
  const session =
    secret
      ? await parseSessionTokenEdge(request.cookies.get(getEdgeSessionCookieName())?.value, secret)
      : null;

  if (pathname === "/login") {
    if (session) {
      const next = request.nextUrl.searchParams.get("next");
      const destination = next && next.startsWith("/") ? next : "/dashboard";
      return NextResponse.redirect(new URL(destination, request.url));
    }
    return NextResponse.next();
  }

  if (isPublicAsset(pathname) || isPublicPage(pathname) || isPublicApi(pathname)) {
    return NextResponse.next();
  }

  if (session) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
