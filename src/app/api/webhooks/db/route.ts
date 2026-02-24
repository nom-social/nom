import { NextResponse } from "next/server";
import { z } from "zod";

import { sendEngagementMilestoneTask } from "@/trigger/send-engagement-milestone";

const dbWebhookPayloadSchema = z.object({
  type: z.enum(["INSERT", "UPDATE", "DELETE"]),
  table: z.string(),
  schema: z.string(),
  record: z.record(z.string(), z.unknown()).nullable(),
  old_record: z.record(z.string(), z.unknown()).nullable(),
});

function getAuthSecret(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);

  return null;
}

function verifyAuth(request: Request): boolean {
  const secret = process.env.INTERNAL_SECRET!;
  const provided = getAuthSecret(request);
  return secret === provided;
}

export async function POST(request: Request) {
  if (!verifyAuth(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const rawBody = await request.json();
    const parsed = dbWebhookPayloadSchema.safeParse(rawBody);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid payload", details: z.treeifyError(parsed.error) },
        { status: 400 }
      );
    }

    const { type, table, record } = parsed.data;

    if (type === "INSERT" && table === "timeline_likes" && record) {
      const dedupe_hash = record.dedupe_hash;
      if (typeof dedupe_hash === "string" && dedupe_hash) {
        await sendEngagementMilestoneTask.trigger({ dedupe_hash });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
