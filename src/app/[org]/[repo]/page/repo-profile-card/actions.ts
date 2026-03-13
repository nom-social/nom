import { fetchMutation, fetchQuery } from "convex/nextjs";
import { api } from "@/../convex/_generated/api";
import { auth } from "@convex-dev/auth/nextjs/server";
import { triggerSubscriberMilestone } from "./server-actions";

export class NotAuthenticatedError extends Error {
  constructor() {
    super("Not authenticated");
  }
}

export async function createSubscription(org: string, repo: string) {
  const { userId } = await auth();
  if (!userId) throw new NotAuthenticatedError();

  const repositoryId = await fetchMutation(api.subscriptions.subscribe, {
    org,
    repo,
  });

  if (repositoryId) {
    await triggerSubscriberMilestone(repositoryId);
  }
}

export async function removeSubscription(org: string, repo: string) {
  const { userId } = await auth();
  if (!userId) throw new NotAuthenticatedError();

  await fetchMutation(api.subscriptions.unsubscribe, { org, repo });
}

export async function isSubscribed(org: string, repo: string) {
  return fetchQuery(api.subscriptions.isSubscribed, { org, repo });
}

isSubscribed.key =
  "src/components/[org]/[repo]/repo-profile-card/actions/isSubscribed";
