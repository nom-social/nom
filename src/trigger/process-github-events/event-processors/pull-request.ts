import { z } from "zod";
import { Octokit } from "@octokit/rest";
import { logger } from "@trigger.dev/sdk/v3";

import { Json, TablesInsert } from "@/types/supabase";
import * as openai from "@/utils/openai/client";
import { zodResponseFormat } from "openai/helpers/zod";

import { getProcessedPullRequestDiff } from "./pull-request/utils";
import {
  PR_ANALYSIS_PROMPT,
  prAnalysisResponseSchema,
} from "./pull-request/prompts";

const pullRequestSchema = z.object({
  action: z.enum(["opened", "closed", "review_requested", "reopened"]),
  pull_request: z.object({
    number: z.number(),
    title: z.string(),
    body: z.string(),
    html_url: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    merged: z.boolean(),
    draft: z.boolean().optional(),
    requested_reviewers: z.array(z.object({ login: z.string() })).optional(),
    user: z.object({ login: z.string() }),
    author_association: z.enum([
      "COLLABORATOR",
      "CONTRIBUTOR",
      "FIRST_TIMER",
      "FIRST_TIME_CONTRIBUTOR",
      "MANNEQUIN",
      "MEMBER",
      "NONE",
      "OWNER",
    ]),
    head: z.object({ ref: z.string(), sha: z.string() }),
    base: z.object({ ref: z.string() }),
    comments: z.number(),
    additions: z.number(),
    deletions: z.number(),
    changed_files: z.number(),
    review_comments: z.number(),
    labels: z.array(z.object({ name: z.string() })),
  }),
});

export async function processPullRequestEvent({
  event,
  repo,
  subscribers,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
  subscribers: { user_id: string }[];
}): Promise<TablesInsert<"user_timeline">[]> {
  const octokit = new Octokit({ auth: repo.access_token || undefined });
  const openaiClient = openai.createClient();

  const validationResult = pullRequestSchema.parse(event.raw_payload);
  const { action, pull_request } = validationResult;

  if ((action === "opened" || action === "reopened") && !pull_request.draft) {
    const [combinedDiff, checks] = await Promise.all([
      getProcessedPullRequestDiff(
        octokit,
        { org: repo.org, repo: repo.repo },
        pull_request.number
      ),
      octokit.checks.listForRef({
        owner: repo.org,
        repo: repo.repo,
        ref: pull_request.head.sha,
      }),
    ]);

    logger.info("Processed file changes for PR", {
      prNumber: pull_request.number,
      combinedDiffLength: combinedDiff.length,
      checksCount: checks.data.total_count,
    });

    const prompt = PR_ANALYSIS_PROMPT.replace("{title}", pull_request.title)
      .replace("{author}", pull_request.user.login)
      .replace("{author_association}", pull_request.author_association)
      .replace("{description}", pull_request.body)
      .replace("{changed_files}", pull_request.changed_files.toString())
      .replace("{additions}", pull_request.additions.toString())
      .replace("{deletions}", pull_request.deletions.toString())
      .replace("{labels}", pull_request.labels.map((l) => l.name).join(", "))
      .replace("{pr_diff}", combinedDiff);

    const completion = await openaiClient.chat.completions.parse({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that analyzes pull requests. " +
            "Provide your analysis in JSON format as specified.",
        },
        { role: "user", content: prompt },
      ],
      response_format: zodResponseFormat(
        prAnalysisResponseSchema,
        "pr_analysis"
      ),
    });

    logger.info("Generated PR analysis", {
      prNumber: pull_request.number,
      analysis: completion.choices[0].message.parsed,
    });

    // TODO: Store the analysis in the database or use it to create timeline entries
  }
  return [];
}
