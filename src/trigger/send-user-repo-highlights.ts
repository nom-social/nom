import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";
import { marked } from "marked";

import * as supabase from "@/utils/supabase/background";
import * as resend from "@/utils/resend/client";
import * as openai from "@/utils/openai/client";

import { EMAIL_PROMPT } from "./send-user-repo-highlights/prompts";

const prSchema = z.object({
  pull_request: z.object({
    ai_summary: z.string(),
    title: z.string(),
    html_url: z.string(),
  }),
  action: z.string(),
});

const issueSchema = z.object({
  issue: z.object({
    ai_summary: z.string(),
    title: z.string(),
    html_url: z.string(),
  }),
  action: z.string(),
});

const pushSchema = z.object({
  push: z.object({
    ai_summary: z.string(),
    title: z.string(),
    html_url: z.string(),
  }),
});

// Manual dev job: Accepts a repositories_users id, finds the repo and user, then fetches all public_timeline events for that repo
export const sendUserRepoHighlights = schemaTask({
  id: "send-user-repo-highlights",
  schema: z.object({
    repo: z.string(),
    org: z.string(),
    user_email: z.string(),
    start: z.coerce.date(),
    end: z.coerce.date(),
  }),
  run: async ({ repo, org, user_email, start, end }) => {
    const supabaseClient = supabase.createClient();
    const openAIClient = openai.createClient();
    const resendClient = resend.createClient();

    // Find the repo details (org, repo)
    const { data: repoData } = await supabaseClient
      .from("repositories")
      .select("id")
      .eq("org", org)
      .eq("repo", repo)
      .single()
      .throwOnError();

    // Fetch all public_timeline events for this repo
    const { data: publicEvents } = await supabaseClient
      .from("public_timeline")
      .select("*")
      .eq("repo_id", repoData.id)
      .gte("updated_at", start.toISOString())
      .lte("updated_at", end.toISOString())
      .throwOnError();

    let combinedEvents = "";
    publicEvents.forEach((event) => {
      if (event.type === "pull_request") {
        const pr = prSchema.parse(event.data);
        combinedEvents +=
          `- [pull_request] ${pr.pull_request.title} (${pr.action})\n` +
          `${pr.pull_request.ai_summary}\n` +
          `[View on GitHub](${pr.pull_request.html_url})\n\n`;
      }
      if (event.type === "issue") {
        const issue = issueSchema.parse(event.data);
        combinedEvents +=
          `- [issue] ${issue.issue.title} (${issue.action})\n` +
          `${issue.issue.ai_summary}\n` +
          `[View on GitHub](${issue.issue.html_url})\n\n`;
      }
      if (event.type === "push") {
        const push = pushSchema.parse(event.data);
        combinedEvents +=
          `- [push] ${push.push.title}\n` +
          `${push.push.ai_summary}\n` +
          `[View on GitHub](${push.push.html_url})\n\n`;
      }
    });

    const combinedPrompt = EMAIL_PROMPT.replace("{events}", combinedEvents)
      .replace("{org}", org)
      .replace("{repo}", repo);

    const response = await openAIClient.chat.completions.create({
      model: "o4-mini",
      messages: [{ role: "user", content: combinedPrompt }],
    });

    await resendClient.emails.send({
      from: "Nom <hello@nomit.dev>",
      to: user_email,
      subject: `${org}/${repo} highlights`,
      html: await marked.parse(response.choices[0].message.content ?? "", {
        breaks: true,
        gfm: true,
      }),
    });
  },
});
