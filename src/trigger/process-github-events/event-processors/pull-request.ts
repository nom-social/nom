import { z } from "zod";

import { Json, TablesInsert } from "@/types/supabase";
import { createClient } from "@/utils/supabase/background";

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
  const supabase = createClient();

  const validationResult = pullRequestSchema.parse(event.raw_payload);
  const { action, pull_request } = validationResult;

  // TODO: Add AI generated insight here
  // TODO: We also need review time
  if ((action === "opened" || action === "reopened") && !pull_request.draft) {
    // TODO: Handle this here
  }
  return [];
}
