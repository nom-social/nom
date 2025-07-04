import { Octokit } from "@octokit/rest";
import { z } from "zod";

const templateSchema = z.string().max(2_000);

export default async function fetchNomTemplate({
  filename,
  repo,
  octokit,
}: {
  filename: string;
  repo: {
    org: string;
    repo: string;
  };
  octokit: Octokit;
}): Promise<string | null> {
  try {
    const { data } = await octokit.repos.getContent({
      owner: repo.org,
      repo: repo.repo,
      path: `.nom/${filename}`,
    });
    if (Array.isArray(data) || !("content" in data)) return null;
    const content = Buffer.from(data.content, "base64").toString("utf-8");
    const parsed = templateSchema.safeParse(content);
    return parsed.success ? content : null;
  } catch {
    return null;
  }
}
