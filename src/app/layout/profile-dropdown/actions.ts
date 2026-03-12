import { auth } from "@convex-dev/auth/nextjs/server";
import { fetchQuery } from "convex/nextjs";
import { api } from "@/../convex/_generated/api";

export async function getCurrentUser() {
  const { userId } = await auth();
  if (!userId) return null;
  return fetchQuery(api.users.getCurrentUser);
}

getCurrentUser.key = "src/app/layout/profile-dropdown/actions/getCurrentUser";
