import { auth } from "@/auth";
import { publicRoutes, authRoutes, apiAuthPrefix } from "@/routes";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;

  // Check if the route is an API auth route
  const isApiAuthRoute = nextUrl.pathname.startsWith(apiAuthPrefix);
  console.log("isApiAuthRoute", isApiAuthRoute);

  // Check if the route is a public route
  const isPublicRoute = publicRoutes.includes(nextUrl.pathname);
  console.log("isPublicRoute", isPublicRoute);

  // Check if the route is an auth route
  const isAuthRoute = authRoutes.includes(nextUrl.pathname);
  console.log("isAuthRoute", isAuthRoute);
  // Check if the route is a shared route
  const isSharedRoute = nextUrl.pathname.startsWith("/shared/");
  console.log("isSharedRoute", isSharedRoute);

  // Check if the route is a chat route (exact match or dynamic route)
  const isChatRoute =
    nextUrl.pathname === "/chat" || nextUrl.pathname.startsWith("/chat/");

  // Define known routes (static routes from your app structure)
  const knownRoutes = [...publicRoutes, ...authRoutes, "/chat"];

  // Check if it's a known route or follows a known pattern
  const isKnownRoute =
    knownRoutes.includes(nextUrl.pathname) ||
    isChatRoute ||
    isSharedRoute ||
    nextUrl.pathname.startsWith("/api/") ||
    nextUrl.pathname.startsWith("/_next/") ||
    nextUrl.pathname.includes(".");

  // Skip middleware for API auth routes
  if (isApiAuthRoute) {
    return;
  }

  // If user is logged in and trying to access auth routes, redirect to chat
  if (isAuthRoute && isLoggedIn) {
    return Response.redirect(new URL("/chat", nextUrl.origin));
  }

  // If user is not logged in and trying to access protected routes, redirect to login
  if (!isLoggedIn && !isPublicRoute && !isAuthRoute && !isSharedRoute) {
    return Response.redirect(new URL("/", nextUrl.origin));
  }

  // Handle non-existent pages (404 scenarios)
  if (!isKnownRoute) {
    if (isLoggedIn) {
      // If user has a session, redirect to /chat
      return Response.redirect(new URL("/chat", nextUrl.origin));
    } else {
      // If no session, redirect to /
      return Response.redirect(new URL("/", nextUrl.origin));
    }
  }
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
