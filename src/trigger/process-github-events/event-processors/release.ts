import { z } from "zod";

import { Json, TablesInsert } from "@/types/supabase";

const releaseSchema = z.object({
  action: z.enum(["published"]),
  release: z.object({
    id: z.number(),
    tag_name: z.string(),
    name: z.string().nullable(),
    body: z.string().nullable(),
    html_url: z.string(),
    created_at: z.coerce.date(),
    published_at: z.coerce.date().nullable(),
    author: z.object({ login: z.string() }),
    assets: z.array(
      z.object({
        name: z.string(),
        size: z.number(),
        download_count: z.number(),
        content_type: z.string(),
        browser_download_url: z.string(),
      })
    ),
  }),
});

export async function processReleaseEvent({
  event,
  repo,
  subscribers,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
  subscribers: { user_id: string }[];
}): Promise<TablesInsert<"user_timeline">[]> {
  const validationResult = releaseSchema.parse(event.raw_payload);
  const { action, release } = validationResult;

  const releaseData = {
    action,
    release: {
      tag_name: release.tag_name,
      name: release.name,
      body: release.body,
      html_url: release.html_url,
      created_at: release.created_at.toISOString(),
      published_at: release.published_at?.toISOString() || null,
      author: { login: release.author.login },
      assets: release.assets.map((asset) => ({
        name: asset.name,
        size: asset.size,
        download_count: asset.download_count,
        content_type: asset.content_type,
        browser_download_url: asset.browser_download_url,
      })),
    },
  };

  const timelineEntries: TablesInsert<"user_timeline">[] = [];

  for (const subscriber of subscribers) {
    timelineEntries.push({
      user_id: subscriber.user_id,
      type: "release",
      data: releaseData,
      score: 100,
      event_bucket_ids: [event.id],
      repo_id: repo.id,
      categories: ["releases"],
    });
  }

  return timelineEntries;
}
