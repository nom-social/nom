import { ConvexHttpClient } from "convex/browser";

/**
 * Server-side Convex client for use in Trigger.dev tasks and API routes.
 * Calls public queries and mutations without user auth context.
 */
export function createAdminConvexClient() {
  const url = process.env.NEXT_PUBLIC_CONVEX_URL;
  if (!url) throw new Error("Missing NEXT_PUBLIC_CONVEX_URL");
  return new ConvexHttpClient(url);
}
