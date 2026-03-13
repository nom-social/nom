import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";

// Only /following requires auth — all other routes are public
const isProtectedPage = createRouteMatcher(["/following(.*)"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  if (isProtectedPage(request) && !(await convexAuth.isAuthenticated())) {
    return nextjsMiddlewareRedirect(request, "/auth/login");
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
