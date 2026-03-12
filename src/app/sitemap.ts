import type { MetadataRoute } from "next";
import { fetchQuery } from "convex/nextjs";

import { BASE_URL } from "@/lib/constants";
import { api } from "@/../convex/_generated/api";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let repos: { org: string; repo: string; _creationTime: number }[] = [];

  try {
    repos = await fetchQuery(api.admin.listRepositories, {});
  } catch {
    // If query fails, return base URL only
  }

  const repoUrls: MetadataRoute.Sitemap = repos.map((repo) => ({
    url: `${BASE_URL}/${repo.org}/${repo.repo}`,
    lastModified: new Date(repo._creationTime),
    changeFrequency: "daily" as const,
    priority: 0.9,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1,
    },
    ...repoUrls,
  ];
}
