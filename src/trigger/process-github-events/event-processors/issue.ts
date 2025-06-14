import { z } from "zod";

import { Json, TablesInsert } from "@/types/supabase";
import { createClient } from "@/utils/supabase/background";

const issueSchema = z.object({
  action: z.enum(["opened", "closed", "reopened", "assigned"]),
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
  subscribers,
}: {
  event: { event_type: string; raw_payload: Json; id: string };
  repo: { repo: string; org: string; id: string; access_token: string | null };
  subscribers: { user_id: string }[];
}): Promise<TablesInsert<"user_timeline">[]> {
  const supabase = createClient();

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
  const timelineEntries: TablesInsert<"user_timeline">[] = [];

  for (const subscriber of subscribers) {
    const { data: user } = await supabase
      .from("users")
      .select("*")
      .eq("id", subscriber.user_id)
      .single()
      .throwOnError();

    const isMyIssue = user.github_username === issue.user.login;
    const isAssignedToMe = issue.assignees.some(
      (assignee) => assignee.login === user.github_username
    );

    timelineEntries.push({
      user_id: subscriber.user_id,
      type: "issue",
      data: issueData,
      score: 100,
      repo_id: repo.id,
      categories: isMyIssue || isAssignedToMe ? ["issues"] : undefined,
    });
  }

  return timelineEntries;
}
