import { fetchQuery } from "convex/nextjs";
import { api } from "@/../convex/_generated/api";

export async function fetchRepoProfile(org: string, repo: string) {
  const repoDoc = await fetchQuery(api.repositories.fetchRepoProfile, {
    org,
    repo,
  });
  if (!repoDoc) return null;

  const meta = repoDoc.metadata as {
    avatar_url?: string;
    description?: string | null;
    created_at?: string;
    homepage_url?: string | null;
    languages?: { name: string; bytes: number }[];
    license?: string | null;
  } | null;

  if (!meta?.created_at) return null;

  return {
    org: repoDoc.org,
    repo: repoDoc.repo,
    createdAt: new Date(meta.created_at),
    description: meta.description ?? null,
    websiteUrl: meta.homepage_url ?? null,
    avatarUrl: meta.avatar_url ?? null,
    topLanguages: meta.languages ?? [],
    license: meta.license ?? null,
    id: repoDoc._id,
    subscriptionCount: repoDoc.subscriptionCount,
    isPrivate: repoDoc.isPrivate,
  };
}
