import { schemaTask } from "@trigger.dev/sdk";
import { z } from "zod";
import { marked } from "marked";
import { format } from "date-fns";

import { createAdminConvexClient } from "@/utils/convex/client";
import { api } from "@/../convex/_generated/api";
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

const pushSchema = z.object({
  push: z.object({
    ai_summary: z.string(),
    title: z.string(),
    html_url: z.string(),
  }),
});

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
    const convex = createAdminConvexClient();
    const openAIClient = openai.createClient();
    const resendClient = resend.createClient();

    const repoDoc = await convex.query(api.admin.getRepository, { org, repo });
    if (!repoDoc) throw new Error(`Repository ${org}/${repo} not found`);

    const publicEvents = await convex.query(
      api.admin.getPublicTimelineForRepo,
      {
        repositoryId: repoDoc._id,
        fromMs: start.getTime(),
        toMs: end.getTime(),
      },
    );

    if (!publicEvents.length) {
      throw new Error("No events found for the specified repo and time range.");
    }

    let combinedEvents = "";
    for (const event of publicEvents) {
      const data = event.data as Record<string, unknown>;
      if (event.type === "pull_request") {
        const pr = prSchema.parse(data);
        combinedEvents +=
          `- [pull_request] ${pr.pull_request.title} (${pr.action})\n` +
          `${pr.pull_request.ai_summary}\n` +
          `[View on GitHub](${pr.pull_request.html_url})\n\n`;
      }
      if (event.type === "push") {
        const push = pushSchema.parse(data);
        combinedEvents +=
          `- [push] ${push.push.title}\n` +
          `${push.push.ai_summary}\n` +
          `[View on GitHub](${push.push.html_url})\n\n`;
      }
    }

    const combinedPrompt = EMAIL_PROMPT.replace("{events}", combinedEvents)
      .replace("{org}", org)
      .replace("{repo}", repo);

    const response = await openAIClient.chat.completions.create({
      model: "gpt-5.2",
      messages: [{ role: "user", content: combinedPrompt }],
    });

    await resendClient.emails.send({
      from: "Nom <hello@nomit.dev>",
      to: user_email,
      subject: `${org}/${repo} highlights: ${format(start, "PPP")} - ${format(end, "PPP")}`,
      html: await marked.parse(response.choices[0].message.content ?? "", {
        breaks: true,
        gfm: true,
      }),
    });
  },
});
