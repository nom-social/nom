import { Octokit } from "@octokit/rest";

import * as openai from "@/utils/openai/client";
import { IssueData } from "@/components/activity-cards/shared/schemas";

import { ISSUE_SUMMARY_PROMPT } from "./prompts";

export async function generateIssueData({
  octokit,
  repo,
  action,
  issue,
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
    state: "open" | "closed";
    html_url: string;
    assignees: { login: string }[];
  };
}) {
  const comments = await octokit.paginate(octokit.issues.listComments, {
    owner: repo.org,
    repo: repo.repo,
    issue_number: issue.number,
    per_page: 100,
  });

  // Generate AI summary for the issue and its comments
  const openaiClient = openai.createClient();
  const commentsText = comments
    .map((c) => `- ${c.user?.login}: ${c.body}`)
    .join("\n");
  const prompt = ISSUE_SUMMARY_PROMPT.replace("{title}", issue.title)
    .replace("{author}", issue.user.login)
    .replace("{body}", issue.body || "No description provided")
    .replace("{comments}", commentsText || "No comments");

  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful assistant that summarizes GitHub issues and their discussions for a timeline feed.",
      },
      { role: "user", content: prompt },
    ],
  });
  const ai_summary = completion.choices[0].message.content;
  if (!ai_summary) {
    throw new Error("Failed to generate AI summary for issue");
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
      assignees: issue.assignees,
      state: issue.state,
      contributors: [
        ...new Set([
          issue.user.login,
          ...comments
            .map((comment) => comment.user?.login)
            .filter((login): login is string => Boolean(login)),
        ]),
      ],
      ai_summary,
    },
  };

  return issueData;
}
