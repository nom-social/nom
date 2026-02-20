import { z } from "zod";
import crypto from "crypto";
import { logger } from "@trigger.dev/sdk";

import { Json, TablesInsert } from "@/types/supabase";
import { ReleaseData } from "@/components/shared/activity-card/shared/schemas";
import { createAdminClient } from "@/utils/supabase/admin";
import fetchNomTemplate, {
  fetchPostCriteria,
} from "@/trigger/shared/fetch-nom-template";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";
import { createEventTools } from "@/trigger/shared/agent-tools";
import { runSummaryAgent } from "@/trigger/shared/run-summary-agent";

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

  const supabase = createAdminClient();

  const [customizedPrompt, postCriteria] = await Promise.all([
    fetchNomTemplate({
      filename: "release_summary_template.txt",
      repo,
      octokit,
    }),
    fetchPostCriteria({ repo, octokit, eventType: "release" }),
  ]);

  const prompt = (customizedPrompt || RELEASE_SUMMARY_PROMPT)
    .replace("{tag_name}", release.tag_name)
    .replace("{name}", release.name || "(no name)")
    .replace("{author}", release.author.login)
    .replace("{published_at}", release.published_at?.toISOString() || "N/A")
    .replace("{body}", release.body || "No release notes provided");

  const tools = createEventTools({
    octokit,
    org: repo.org,
    repo: repo.repo,
  });

  const result = await runSummaryAgent({
    prompt,
    postCriteria,
    tools,
  });

  if (!result.should_post) {
    logger.info("Skipping post (AI decided low impact)", {
      org: repo.org,
      repo: repo.repo,
      eventType: "release",
      tagName: release.tag_name,
    });
    return {
      userTimelineEntries: [],
      publicTimelineEntries: [],
    };
  }

  const ai_summary = result.summary;

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
