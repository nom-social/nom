"use server";

import { fetchMutation, fetchQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/../convex/_generated/api";
import { NotAuthenticatedError } from "@/lib/errors";
import { triggerSubscriberMilestone } from "./server-actions";


export async function createSubscription(org: string, repo: string) {
  const token = await convexAuthNextjsToken();
  if (!token) throw new NotAuthenticatedError();

  const repositoryId = await fetchMutation(
    api.subscriptions.subscribe,
    { org, repo },
    { token },
  );

  if (repositoryId) {
    await triggerSubscriberMilestone(repositoryId);
  }
}

export async function removeSubscription(org: string, repo: string) {
  const token = await convexAuthNextjsToken();
  if (!token) throw new NotAuthenticatedError();

  await fetchMutation(api.subscriptions.unsubscribe, { org, repo }, { token });
}

export async function isSubscribed(org: string, repo: string) {
  return fetchQuery(api.subscriptions.isSubscribed, { org, repo });
}

isSubscribed.key =
  "src/components/[org]/[repo]/repo-profile-card/actions/isSubscribed";
