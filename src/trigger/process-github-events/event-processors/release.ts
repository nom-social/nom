import { z } from "zod";
import crypto from "crypto";

import { Json, TablesInsert } from "@/types/supabase";
import * as openai from "@/utils/openai/client";
import { ReleaseData } from "@/components/shared/activity-card/shared/schemas";
import { createClient } from "@/utils/supabase/background";
import fetchNomTemplate from "@/trigger/shared/fetch-nom-template";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";

import { BASELINE_SCORE, RELEASE_MULTIPLIER } from "./shared/constants";
import { RELEASE_SUMMARY_PROMPT } from "./release/prompts";

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

export async function processReleaseEvent({
  event,
  repo,
  subscribers,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: {
    repo: string;
    org: string;
    id: string;
  };
  subscribers: { user_id: string }[];
}): Promise<{
  userTimelineEntries: TablesInsert<"user_timeline">[];
  publicTimelineEntries: TablesInsert<"public_timeline">[];
}> {
  const validationResult = releaseSchema.parse(event.raw_payload);
  const octokit = await createAuthenticatedOctokitClient({
    org: repo.org,
    repo: repo.repo,
  });
  const { action, release } = validationResult;

  // LLM summarization of release notes
  const supabase = createClient();
  const openaiClient = openai.createClient();

  const customizedPrompt = await fetchNomTemplate({
    filename: "release_summary_template.txt",
    repo,
    octokit,
  });

  const prompt = (customizedPrompt || RELEASE_SUMMARY_PROMPT)
    .replace("{tag_name}", release.tag_name)
    .replace("{name}", release.name || "(no name)")
    .replace("{author}", release.author.login)
    .replace("{published_at}", release.published_at?.toISOString() || "N/A")
    .replace("{body}", release.body || "No release notes provided");

  const completion = await openaiClient.chat.completions.create({
    model: "o4-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes GitHub releases for " +
          "repo consumers/integrators. Provide a concise summary as instructed.",
      },
      { role: "user", content: prompt },
    ],
  });
  const ai_summary = completion.choices[0].message.content;
  if (!ai_summary) {
    throw new Error("Failed to generate AI summary for release");
  }

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
      ai_summary,
      contributors: [release.author.login],
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
    updated_at:
      release.published_at?.toISOString() || release.created_at.toISOString(),
    event_ids: [event.id],
    is_read: false,
    search_text: [
      releaseData.release.name || releaseData.release.tag_name,
      releaseData.release.ai_summary,
    ]
      .filter((text) => text.trim().length > 0)
      .join(" "),
  };
  const userTimelineEntries: TablesInsert<"user_timeline">[] = [];

  // Batch query all subscriber users at once
  const subscriberIds = subscribers.map((s) => s.user_id);
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .in("id", subscriberIds)
    .throwOnError();

  for (const user of users ?? []) {
    userTimelineEntries.push({
      ...timelineEntry,
      user_id: user.id,
      categories: ["releases"],
    });
  }

  return {
    userTimelineEntries,
    publicTimelineEntries: [timelineEntry],
  };
}
