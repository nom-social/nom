import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/../convex/_generated/api";

export async function getCurrentUser() {
  const token = await convexAuthNextjsToken();
  if (!token) return null;
  return fetchQuery(api.users.getCurrentUser, {}, { token });
}

getCurrentUser.key = "src/app/layout/profile-dropdown/actions/getCurrentUser";
