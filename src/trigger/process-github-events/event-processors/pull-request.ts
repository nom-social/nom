import { z } from "zod";
import crypto from "crypto";

import { Json, TablesInsert } from "@/types/supabase";
import * as openai from "@/utils/openai/client";
import { createClient } from "@/utils/supabase/background";
import { PrData } from "@/components/shared/activity-card/shared/schemas";
import fetchNomTemplate from "@/trigger/shared/fetch-nom-template";
import propagateLicenseChange from "@/trigger/shared/propagate-license-changes";
import { createAuthenticatedOctokitClient } from "@/utils/octokit/client";

import { getProcessedPullRequestDiff } from "./pull-request/utils";
import { PR_SUMMARY_ONLY_PROMPT } from "./pull-request/prompts";
import { BASELINE_SCORE, PULL_REQUEST_MULTIPLIER } from "./shared/constants";

const pullRequestSchema = z.object({
  action: z.enum(["closed"]),
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
    assignees: z.array(z.object({ login: z.string() })).optional(),
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
  const octokit = await createAuthenticatedOctokitClient({
    org: repo.org,
    repo: repo.repo,
  });
  const openaiClient = openai.createClient();
  const supabase = createClient();

  const validationResult = pullRequestSchema.parse(event.raw_payload);
  const { action, pull_request } = validationResult;

  const constructPRData = async () => {
    const [combinedDiff, checks, commits, reviews] = await Promise.all([
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
      octokit.pulls.listCommits({
        owner: repo.org,
        repo: repo.repo,
        pull_number: pull_request.number,
      }),
      octokit.pulls.listReviews({
        owner: repo.org,
        repo: repo.repo,
        pull_number: pull_request.number,
      }),
    ]);

    // Format commit messages
    const commitMessages = commits.data
      .map(
        (commit) =>
          `- ${commit.commit.message} (${commit.author?.login || "unknown"})`
      )
      .join("\n");
    const commitMessagesText = `Commit Messages (latest first):\n${commitMessages}`;

    // Format reviews
    const reviewSummaries = reviews.data
      .map(
        (review) =>
          `- ${review.user?.login || "unknown"} [${review.state}]: ${
            review.body ? review.body.substring(0, 200) : "No comment"
          }`
      )
      .join("\n");
    const reviewsText = `Pull Request Reviews:\n${reviewSummaries}`;

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

    const customizedPrompt = await fetchNomTemplate({
      filename: "pull_request_summary_template.txt",
      repo,
      octokit,
    });
    const prompt = (customizedPrompt || PR_SUMMARY_ONLY_PROMPT)
      .replace("{title}", pull_request.title)
      .replace("{author}", pull_request.user.login)
      .replace("{author_association}", pull_request.author_association)
      .replace("{description}", pull_request.body || "No description provided")
      .replace("{changed_files}", pull_request.changed_files.toString())
      .replace("{additions}", pull_request.additions.toString())
      .replace("{deletions}", pull_request.deletions.toString())
      .replace("{labels}", pull_request.labels.map((l) => l.name).join(", "))
      .replace("{checks_status}", checksStatusText)
      .replace("{pr_diff}", combinedDiff)
      .replace("{commit_messages}", commitMessagesText)
      .replace("{pr_reviews}", reviewsText);

    const completion = await openaiClient.chat.completions.create({
      model: "o4-mini",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful assistant that summarizes pull requests. Provide a concise summary as instructed.",
        },
        { role: "user", content: prompt },
      ],
    });

    const ai_summary = completion.choices[0].message.content;
    if (!ai_summary) {
      throw new Error("Failed to generate AI summary for pull request");
    }

    const prData: PrData = {
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
        updated_at: pull_request.updated_at.toISOString(),
        ai_summary,
        requested_reviewers: pull_request.requested_reviewers,
        merged: pull_request.merged,
        contributors: [
          ...new Set([
            pull_request.user.login,
            ...commits.data
              .map((commit) => commit.author?.login)
              .filter((login): login is string => Boolean(login)),
            ...(pull_request.assignees?.map((assignee) => assignee.login) ||
              []),
            ...(pull_request.requested_reviewers?.map(
              (reviewer) => reviewer.login
            ) || []),
          ]),
        ],
      },
    };

    return prData;
  };

  const dedupeHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        number: pull_request.number,
        org: repo.org,
        repo: repo.repo,
        type: "pull_request",
      })
    )
    .digest("hex");

  if (!pull_request.merged)
    return {
      userTimelineEntries: [],
      publicTimelineEntries: [],
    };

  // Propagate license change if LICENSE file was changed in this PR's merge commit
  await propagateLicenseChange({
    octokit,
    repo: { org: repo.org, repo: repo.repo },
    ref: pull_request.head.sha,
  });

  const prData = await constructPRData();

  const timelineEntry = {
    type: "pull_request",
    data: prData,
    score: BASELINE_SCORE * PULL_REQUEST_MULTIPLIER,
    repo_id: repo.id,
    dedupe_hash: dedupeHash,
    updated_at: pull_request.updated_at.toISOString(),
    event_ids: [event.id],
    is_read: false,
    search_text: [prData.pull_request.title, prData.pull_request.ai_summary]
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
    const isMyReview = user.github_username === pull_request.user.login;
    const isReviewAssignedToMe = !!pull_request.requested_reviewers?.some(
      (reviewer) => reviewer.login === user.github_username
    );

    userTimelineEntries.push({
      user_id: user.id,
      categories:
        isMyReview || isReviewAssignedToMe ? ["pull_requests"] : undefined,
      ...timelineEntry,
    });
  }

  return {
    userTimelineEntries,
    publicTimelineEntries: [timelineEntry],
  };
}
