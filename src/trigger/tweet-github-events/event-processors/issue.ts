import { z } from "zod";
import crypto from "crypto";

import { Json } from "@/types/supabase";

import { TimelineEvent } from "./shared/types";

const issueSchema = z.object({
  action: z.enum(["opened", "closed"]),
  issue: z.object({
    number: z.number(),
    title: z.string(),
    body: z.string().nullable(),
    html_url: z.string(),
    created_at: z.coerce.date(),
    updated_at: z.coerce.date(),
    state: z.enum(["open", "closed"]),
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
    assignee: z.object({ login: z.string() }).nullable(),
    assignees: z.array(z.object({ login: z.string() })),
    labels: z.array(z.object({ name: z.string() })),
    comments: z.number(),
  }),
});

export async function processIssueEvent({
  event,
  repo,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
}): Promise<TimelineEvent[]> {
  const validationResult = issueSchema.parse(event.raw_payload);
  const { action, issue } = validationResult;

  const issueData = {
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
    },
  };

  const dedupeHash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        action,
        number: issue.number,
        org: repo.org,
        repo: repo.repo,
        type: "issue",
      })
    )
    .digest("hex");

  const timelineEntries: TimelineEvent[] = [];
  timelineEntries.push({
    type: "issue",
    data: issueData,
    dedupeHash,
  });

  return timelineEntries;
}
