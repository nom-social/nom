import { NextRequest, NextResponse } from "next/server";

import { sendEngagementMilestoneTask } from "@/trigger/send-engagement-milestone";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse(null, { status: 401 });

    const { dedupe_hash } = await request.json();
    if (!dedupe_hash) return new NextResponse(null, { status: 400 });

    await sendEngagementMilestoneTask.trigger(
      { dedupe_hash },
      { concurrencyKey: dedupe_hash },
    );

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
