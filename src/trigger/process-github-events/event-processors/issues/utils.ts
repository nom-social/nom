import { Octokit } from "@octokit/rest";

import * as openai from "@/utils/openai/client";
import { IssueData } from "@/components/shared/activity-card/shared/schemas";
import { fetchNomInstructions } from "@/trigger/shared/fetch-nom-template";
import { summaryWithPostDecisionTextFormat } from "@/trigger/shared/summary-with-post-decision";

export async function generateIssueData({
  octokit,
  repo,
  action,
  issue,
  eventType = "issue",
}: {
  octokit: Octokit;
  repo: { org: string; repo: string };
  action: string;
  issue: {
    number: number;
    title: string;
    body: string | null;
    user: { login: string };
    created_at: Date;
    updated_at: Date;
    state: "open" | "closed";
    html_url: string;
    assignees: { login: string }[];
  };
  eventType?: "issue" | "issue_comment";
}): Promise<{ issueData: IssueData | null; shouldPost: boolean }> {
  const comments = await octokit.paginate(octokit.issues.listComments, {
    owner: repo.org,
    repo: repo.repo,
    issue_number: issue.number,
    per_page: 100,
  });

  const openaiClient = openai.createClient();
  const commentsText = comments
    .map((c) => `- ${c.user?.login}: ${c.body}`)
    .join("\n");

  const instructions = await fetchNomInstructions({
    eventType,
    repo,
    octokit,
  });

  const context = `Here's the issue:
Title: ${issue.title}
Author: ${issue.user.login}
Description: ${issue.body || "No description provided"}

Comments:
${commentsText || "No comments"}`;

  const response = await openaiClient.responses.parse({
    model: "gpt-5.2",
    instructions:
      "You summarize GitHub issues and their discussions and decide whether to post to the feed. " +
      "Respond with JSON containing summary (concise 1-3 sentence feed summary) and should_post (boolean).\n\n---\n\n" +
      instructions,
    input: context,
    text: { format: summaryWithPostDecisionTextFormat },
    store: false,
  });

  const result = response.output_parsed;
  if (!result) {
    throw new Error("Failed to parse AI response for issue");
  }

  if (!result.should_post) {
    return { issueData: null, shouldPost: false };
  }

  const issueData: IssueData = {
    action,
    issue: {
      user: { login: issue.user.login },
      number: issue.number,
      title: issue.title,
      body: issue.body,
      html_url: issue.html_url,
      created_at: issue.created_at.toISOString(),
      updated_at: issue.updated_at.toISOString(),
      assignees: issue.assignees,
      state: issue.state,
      contributors: [
        ...new Set([
          issue.user.login,
          ...comments
            .map((comment) => comment.user?.login)
            .filter((login): login is string => Boolean(login)),
          ...issue.assignees.map((assignee) => assignee.login),
        ]),
      ],
      ai_summary: result.summary,
    },
  };

  return { issueData, shouldPost: true };
}
