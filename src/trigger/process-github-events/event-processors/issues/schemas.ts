import z from "zod";

export const issueSchema = z.object({
  action: z.enum(["opened", "closed", "reopened", "assigned", "edited"]),
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

export type IssueSchema = z.infer<typeof issueSchema>;
