import type { MetadataRoute } from "next";

import { BASE_URL } from "@/lib/constants";
import { createClient } from "@/utils/supabase/server";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: repos } = await supabase
    .from("repositories")
    .select("org, repo, created_at");

  const repoUrls: MetadataRoute.Sitemap = (repos || []).map((repo) => ({
    url: `${BASE_URL}/${repo.org}/${repo.repo}`,
    lastModified: repo.created_at ? new Date(repo.created_at) : new Date(),
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
