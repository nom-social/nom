import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

import { createClient } from "@/utils/supabase/background";

interface OctokitClientOptions {
  org: string;
  repo: string;
}

export async function createAuthenticatedOctokitClient(
  options?: OctokitClientOptions
) {
  let installationId: number | undefined;
  if (options) {
    const supabase = createClient();
    // repositories_secure is joined via id
    const { data: repoRow } = await supabase
      .from("repositories")
      .select("id, repositories_secure(installation_id)")
      .eq("org", options.org)
      .eq("repo", options.repo)
      .single()
      .throwOnError();
    installationId = repoRow.repositories_secure?.installation_id;
  }

  // If installationId found, exchange for access token
  if (installationId) {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n"
    );
    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: Number(appId),
        privateKey,
        installationId,
      },
    });
    return octokit;
  }

  // Fallback: return unauthenticated Octokit
  return new Octokit();
}
