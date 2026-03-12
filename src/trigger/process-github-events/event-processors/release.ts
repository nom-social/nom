import { z } from "zod";
import crypto from "crypto";
import { logger } from "@trigger.dev/sdk";

import { ReleaseData } from "@/components/shared/activity-card/shared/schemas";
import { fetchNomInstructions } from "@/trigger/shared/fetch-nom-template";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";
import { createEventTools } from "@/trigger/shared/agent-tools";
import { runSummaryAgent } from "@/trigger/shared/run-summary-agent";

import { BASELINE_SCORE, RELEASE_MULTIPLIER } from "./shared/constants";
import { type TimelineEntry } from "./pull-request";

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
      }),
    ),
  }),
});

export async function processReleaseEvent({
  event,
  repo,
  subscribers,
}: {
  event: { event_type: string; raw_payload: unknown; id: string };
  repo: {
    repo: string;
    org: string;
    id: string;
  };
  subscribers: { user_id: string }[];
}): Promise<{
  userTimelineEntries: TimelineEntry[];
  publicTimelineEntries: TimelineEntry[];
}> {
  const validationResult = releaseSchema.parse(event.raw_payload);
  const octokit = await createAuthenticatedOctokitClient({
    org: repo.org,
    repo: repo.repo,
  });
  const { action, release } = validationResult;

  const instructions = await fetchNomInstructions({
    eventType: "release",
    repo,
    octokit,
  });

  const context = `Here is the release info:
Tag: ${release.tag_name}
Name: ${release.name || "(no name)"}
Author: ${release.author.login}
Published at: ${release.published_at?.toISOString() || "N/A"}
Release notes:
${release.body || "No release notes provided"}

You can use explore_file with ref=${release.tag_name} to read files at the release tag, compare_refs to diff between tags (e.g. previous...${release.tag_name}), get_pull_request if you need PR context, or find_meme to add a relevant meme when appropriate.`;

  const tools = createEventTools({
    octokit,
    org: repo.org,
    repo: repo.repo,
  });

  logger.info("Running summary agent", {
    org: repo.org,
    repo: repo.repo,
    eventType: "release",
    tagName: release.tag_name,
  });
  const result = await runSummaryAgent({
    instructions,
    context,
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
      name: result.title,
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
      }),
    )
    .digest("hex");

  const updatedAt = release.published_at ?? release.created_at;

  const timelineEntry: TimelineEntry = {
    type: "release",
    data: releaseData,
    score: BASELINE_SCORE * RELEASE_MULTIPLIER,
    repositoryId: repo.id,
    dedupeHash,
    updatedAt: updatedAt.getTime(),
    eventIds: [event.id],
    isRead: false,
    searchText: [
      releaseData.release.name ?? releaseData.release.tag_name,
      releaseData.release.ai_summary,
    ]
      .filter((text) => text.trim().length > 0)
      .join(" "),
  };
  // One entry per subscriber — if you follow the repo, you get the event
  const userTimelineEntries: TimelineEntry[] = subscribers.map((s) => ({
    ...timelineEntry,
    userId: s.user_id,
    categories: ["releases"],
  }));

  return {
    userTimelineEntries,
    publicTimelineEntries: [timelineEntry],
  };
}
