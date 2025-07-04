import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

import { createClient } from "@/utils/supabase/background";

interface OctokitClientOptions {
  org: string;
  repo: string;
}

// TODO: Find a way to store the private key
export async function getOctokitClient(options?: OctokitClientOptions) {
  let installationId: number | undefined;
  if (options) {
    const supabase = createClient();
    // repositories_secure is joined via id
    const { data: repoRow } = await supabase
      .from("repositories")
      .select("id, repositories_secure(installation_id)")
      .eq("org", options.org)
      .eq("repo", options.repo)
      .single();
    installationId = repoRow?.repositories_secure?.installation_id
      ? Number(repoRow.repositories_secure.installation_id)
      : undefined;
  }

  // If installationId found, exchange for access token
  if (installationId) {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    if (!appId || !privateKey) {
      throw new Error(
        "Missing GITHUB_APP_ID or GITHUB_APP_PRIVATE_KEY env vars"
      );
    }
    // Use Octokit with app auth strategy
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
