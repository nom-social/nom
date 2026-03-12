import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  isAuthenticatedNextjs,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Only /following requires auth — all other routes are public
const isProtectedPage = createRouteMatcher(["/following(.*)"]);

export default convexAuthNextjsMiddleware((request) => {
  if (isProtectedPage(request) && !isAuthenticatedNextjs(request)) {
    return nextjsMiddlewareRedirect(request, "/auth/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
