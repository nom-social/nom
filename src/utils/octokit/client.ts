import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

import { createAdminConvexClient } from "@/utils/convex/client";
import { api } from "@/convex/_generated/api";

interface OctokitClientOptions {
  org: string;
  repo: string;
}

export async function createAuthenticatedOctokitClient(
  options?: OctokitClientOptions,
) {
  let installationId: number | undefined;
  if (options) {
    const convex = createAdminConvexClient();
    const repoRow = await convex.query(api.admin.getRepository, {
      org: options.org,
      repo: options.repo,
    });
    if (repoRow) {
      const secure = await convex.query(api.admin.getRepositorySecure, {
        repositoryId: repoRow._id,
      });
      installationId = secure?.installationId;
    }
  }

  // If installationId found, exchange for access token
  if (installationId) {
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(
      /\\n/g,
      "\n",
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
