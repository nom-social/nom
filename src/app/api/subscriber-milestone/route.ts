import { NextRequest, NextResponse } from "next/server";

import { sendSubscriberMilestoneTask } from "@/trigger/send-subscriber-milestone";
import { createClient } from "@/utils/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return new NextResponse(null, { status: 401 });

    const { repo_id } = await request.json();
    if (!repo_id) return new NextResponse(null, { status: 400 });

    await sendSubscriberMilestoneTask.trigger(
      { repo_id },
      { concurrencyKey: repo_id },
    );

    return new NextResponse(null, { status: 204 });
  } catch {
    return new NextResponse(null, { status: 500 });
  }
}
