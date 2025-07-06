import { schemaTask } from "@trigger.dev/sdk/v3";
import { z } from "zod";

import * as supabase from "@/utils/supabase/background";
import * as resend from "@/utils/resend/client";

// Manual dev job: Accepts a repositories_users id, finds the repo and user, then fetches all public_timeline events for that repo
export const sendUserRepoHighlights = schemaTask({
  id: "send-user-repo-highlights",
  schema: z.object({
    repo: z.string(),
    org: z.string(),
    user_email: z.string(),
  }),
  run: async ({ repo, org, user_email }) => {
    const supabaseClient = supabase.createClient();
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
      .throwOnError();

    console.log(publicEvents.length, user_email);
  },
});
