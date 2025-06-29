import { z } from "zod";
import crypto from "crypto";
import { zodResponseFormat } from "openai/helpers/zod";

import { Json, TablesInsert } from "@/types/supabase";
import * as openai from "@/utils/openai/client";

import { BASELINE_SCORE, RELEASE_MULTIPLIER } from "./shared/constants";
import { RELEASE_ANALYSIS_PROMPT } from "./release/prompts";
import { ReleaseData } from "@/components/activity-cards/shared/schemas";

const releaseSchema = z.object({
  action: z.enum(["published", "edited"]),
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

// Release analysis prompt and schema

const releaseAnalysisResponseSchema = z.object({
  summary: z.string(),
  breaking_changes: z.array(z.string()),
  notable_additions: z.array(z.string()),
  migration_notes: z.array(z.string()),
});

export async function processReleaseEvent({
  event,
  repo,
  subscribers,
  currentTimestamp,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token?: string | null };
  subscribers: { user_id: string }[];
  currentTimestamp: string;
}): Promise<{
  userTimelineEntries: TablesInsert<"user_timeline">[];
  publicTimelineEntries: TablesInsert<"public_timeline">[];
}> {
  const validationResult = releaseSchema.parse(event.raw_payload);
  const { action, release } = validationResult;

  // LLM summarization of release notes
  const openaiClient = openai.createClient();
  const prompt = RELEASE_ANALYSIS_PROMPT.replace("{tag_name}", release.tag_name)
    .replace("{name}", release.name || "(no name)")
    .replace("{author}", release.author.login)
    .replace("{published_at}", release.published_at?.toISOString() || "N/A")
    .replace("{body}", release.body || "No release notes provided");

  const completion = await openaiClient.chat.completions.parse({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes GitHub releases for repo " +
          "consumers/integrators. Provide your analysis in JSON format as specified.",
      },
      { role: "user", content: prompt },
    ],
    response_format: zodResponseFormat(
      releaseAnalysisResponseSchema,
      "release_analysis"
    ),
  });
  const analysis = completion.choices[0].message.parsed;

  const releaseData: ReleaseData = {
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
      ai_analysis: analysis,
    },
  };

  const dedupeHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        tag_name: release.tag_name,
        org: repo.org,
        repo: repo.repo,
        type: "release",
      })
    )
    .digest("hex");

  const timelineEntry = {
    type: "release",
    data: releaseData,
    score: BASELINE_SCORE * RELEASE_MULTIPLIER,
    repo_id: repo.id,
    dedupe_hash: dedupeHash,
    updated_at: currentTimestamp,
    event_ids: [event.id],
    is_read: false,
  };
  const userTimelineEntries: TablesInsert<"user_timeline">[] = [];

  for (const subscriber of subscribers) {
    userTimelineEntries.push({
      ...timelineEntry,
      user_id: subscriber.user_id,
      categories: ["releases"],
    });
  }

  return {
    userTimelineEntries,
    publicTimelineEntries: [timelineEntry],
  };
}
