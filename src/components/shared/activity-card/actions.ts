"use server";

import { fetchMutation } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/../convex/_generated/api";
import { NotAuthenticatedError } from "@/lib/errors";

export async function createLike(dedupeHash: string) {
  const token = await convexAuthNextjsToken();
  if (!token) throw new NotAuthenticatedError();

  await fetchMutation(api.likes.createLike, { dedupeHash }, { token });
}

export async function deleteLike(dedupeHash: string) {
  const token = await convexAuthNextjsToken();
  if (!token) throw new NotAuthenticatedError();

  await fetchMutation(api.likes.deleteLike, { dedupeHash }, { token });
}
