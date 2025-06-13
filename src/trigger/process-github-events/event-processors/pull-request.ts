import { z } from "zod";
import { Octokit } from "@octokit/rest";

import { Json, TablesInsert } from "@/types/supabase";
import * as openai from "@/utils/openai/client";
import { createClient } from "@/utils/supabase/background";
import { zodResponseFormat } from "openai/helpers/zod";

import { getProcessedPullRequestDiff } from "./pull-request/utils";
import {
  PR_ANALYSIS_PROMPT,
  prAnalysisResponseSchema,
} from "./pull-request/prompts";

const pullRequestSchema = z.object({
  action: z.enum([
    "opened",
    "closed",
    "review_requested",
    "reopened",
    "ready_for_review",
  ]),
  pull_request: z.object({
    number: z.number(),
    title: z.string(),
    body: z.string().nullable(),
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
  const supabase = createClient();

  const validationResult = pullRequestSchema.parse(event.raw_payload);
  const { action, pull_request } = validationResult;

  const constructPRData = async () => {
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

    const checksStatus = {
      total: checks.data.total_count,
      passed: checks.data.check_runs.filter((c) => c.conclusion === "success")
        .length,
      failed: checks.data.check_runs.filter((c) => c.conclusion === "failure")
        .length,
      pending: checks.data.check_runs.filter(
        (c) => c.status === "in_progress" || c.status === "queued"
      ).length,
    };

    const checksStatusText =
      "Total Checks: " +
      checksStatus.total +
      "\n" +
      "Passed: " +
      checksStatus.passed +
      "\n" +
      "Failed: " +
      checksStatus.failed +
      "\n" +
      "Pending: " +
      checksStatus.pending +
      "\n\n" +
      "Failed Checks:\n" +
      checks.data.check_runs
        .filter((c) => c.conclusion === "failure")
        .map(
          (c) =>
            "- " + c.name + ": " + (c.output?.summary || "No details available")
        )
        .join("\n") +
      "\n\n" +
      "Pending Checks:\n" +
      checks.data.check_runs
        .filter((c) => c.status === "in_progress" || c.status === "queued")
        .map((c) => "- " + c.name)
        .join("\n");

    const prompt = PR_ANALYSIS_PROMPT.replace("{title}", pull_request.title)
      .replace("{author}", pull_request.user.login)
      .replace("{author_association}", pull_request.author_association)
      .replace("{description}", pull_request.body || "No description provided")
      .replace("{changed_files}", pull_request.changed_files.toString())
      .replace("{additions}", pull_request.additions.toString())
      .replace("{deletions}", pull_request.deletions.toString())
      .replace("{labels}", pull_request.labels.map((l) => l.name).join(", "))
      .replace("{checks_status}", checksStatusText)
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

    const prData = {
      action,
      pull_request: {
        stats: {
          comments_count: pull_request.comments,
          additions: pull_request.additions,
          deletions: pull_request.deletions,
          changed_files: pull_request.changed_files,
        },
        head_checks: {
          total: checks.data.total_count,
          passing: checks.data.check_runs.filter(
            (check) => check.conclusion === "success"
          ).length,
          failing: checks.data.check_runs.filter(
            (check) => check.conclusion === "failure"
          ).length,
        },
        head: { ref: pull_request.head.ref },
        base: { ref: pull_request.base.ref },
        user: { login: pull_request.user.login },
        number: pull_request.number,
        title: pull_request.title,
        body: pull_request.body,
        html_url: pull_request.html_url,
        created_at: pull_request.created_at.toISOString(),
        ai_analysis: completion.choices[0].message.parsed,
        requested_reviewers: pull_request.requested_reviewers,
        merged: pull_request.merged,
      },
    };

    return prData;
  };

  if (
    action === "opened" ||
    action === "reopened" ||
    action === "ready_for_review" ||
    action === "review_requested"
  ) {
    if (pull_request.draft) return [];

    const prData = await constructPRData();

    const timelineEntries: TablesInsert<"user_timeline">[] = [];
    for (const subscriber of subscribers) {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", subscriber.user_id)
        .single()
        .throwOnError();

      const isMyReview =
        user.github_username === pull_request.user.login ||
        !!pull_request.requested_reviewers?.some(
          (r) => r.login === user.github_username
        );

      timelineEntries.push({
        user_id: subscriber.user_id,
        type: "pr update",
        data: prData,
        score: 100,
        visible_at: new Date().toISOString(),
        event_bucket_ids: [event.id],
        repo_id: repo.id,
        categories: isMyReview ? ["pull_requests"] : undefined,
      });
    }

    return timelineEntries;
  }

  if (action === "closed") {
    if (!pull_request.merged) return [];

    const prData = await constructPRData();

    const timelineEntries: TablesInsert<"user_timeline">[] = [];
    for (const subscriber of subscribers) {
      const { data: user } = await supabase
        .from("users")
        .select("*")
        .eq("id", subscriber.user_id)
        .single()
        .throwOnError();

      const isMyReview =
        user.github_username === pull_request.user.login ||
        !!pull_request.requested_reviewers?.some(
          (r) => r.login === user.github_username
        );

      timelineEntries.push({
        user_id: subscriber.user_id,
        type: "pr update",
        data: prData,
        score: 100,
        visible_at: new Date().toISOString(),
        event_bucket_ids: [event.id],
        repo_id: repo.id,
        categories: isMyReview ? ["pull_requests"] : undefined,
      });
    }
  }

  return [];
}
