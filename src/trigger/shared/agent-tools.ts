import crypto from "crypto";

import type { Octokit } from "@octokit/rest";
import { randomUUID } from "node:crypto";
import { tool } from "ai";
import { z } from "zod";
import { logger } from "@trigger.dev/sdk";

import { createClient as createTavilyClient } from "@/utils/tavily/client";
import { filterAndFormatDiff } from "@/trigger/process-github-events/event-processors/shared/diff-utils";
import { createAdminClient } from "@/utils/supabase/admin";

const MAX_FILE_CONTENT_BYTES = 50_000;
const IMAGE_VERIFY_TIMEOUT_MS = 5_000;
const MAX_VERIFIED_IMAGES = 1;
const MEME_BUCKET = "meme-images";
const MEME_MAX_BYTES = 10 * 1024 * 1024; // 10 MiB — matches bucket file_size_limit
const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": ".jpg",
  "image/jpg": ".jpg",
  "image/png": ".png",
  "image/gif": ".gif",
  "image/webp": ".webp",
  "image/svg+xml": ".svg",
};

const MEMEGEN_API_BASE = "https://api.memegen.link";
// Cap template search output so tool responses stay concise for agent consumption.
const MEMEGEN_TEMPLATES_LIMIT = 10;

function sanitizeStoragePathSegment(value: string): string {
  const sanitized = value
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return sanitized || "unknown";
}

function extensionFromContentType(contentType: string | null): string {
  const raw = contentType?.split(";")[0]?.trim().toLowerCase();
  if (!raw) return ".png";

  let normalized = raw;
  if (!raw.includes("/") && !raw.includes("+")) {
    normalized = `image/${raw}`;
  }
  return CONTENT_TYPE_TO_EXT[normalized] ?? ".png";
}

async function persistMemeImage({
  sourceUrl,
  org,
  repo,
  templateId,
}: {
  sourceUrl: string;
  org: string;
  repo: string;
  templateId: string;
}): Promise<string> {
  const imageRes = await fetch(sourceUrl, { redirect: "follow" });
  if (!imageRes.ok) {
    throw new Error(`Failed to fetch meme image: ${imageRes.status}`);
  }

  const contentType = imageRes.headers.get("content-type");
  if (!contentType?.startsWith("image/")) {
    throw new Error("Fetched meme response is not an image");
  }

  const imageBuffer = Buffer.from(await imageRes.arrayBuffer());
  if (imageBuffer.byteLength > MEME_MAX_BYTES) {
    throw new Error(`Meme image exceeds max size (${MEME_MAX_BYTES} bytes)`);
  }
  const ext = extensionFromContentType(contentType);
  const objectPath = [
    sanitizeStoragePathSegment(org),
    sanitizeStoragePathSegment(repo),
    sanitizeStoragePathSegment(templateId),
    `${randomUUID()}${ext}`,
  ].join("/");

  const supabase = createAdminClient();
  const bucket = supabase.storage.from(MEME_BUCKET);
  const { error: uploadError } = await bucket.upload(objectPath, imageBuffer, {
    contentType,
    upsert: false,
    cacheControl: "31536000", // 1 year
  });
  if (uploadError) {
    throw new Error(`Failed to upload meme image: ${uploadError.message}`);
  }

  const { data } = bucket.getPublicUrl(objectPath);
  if (!data?.publicUrl) {
    throw new Error("Failed to generate public URL for stored meme image");
  }
  return data.publicUrl;
}

const MEME_IMAGE_FORMATS = ["png", "jpg", "gif", "webp"] as const;
type MemeImageFormat = (typeof MEME_IMAGE_FORMATS)[number];

/**
 * Build a memegen.link image URL for the given template and text lines.
 */
export function buildMemeUrl(
  templateId: string,
  lines: string[],
  format: MemeImageFormat = "png",
): string {
  function encodeMemeText(text: string): string {
    return text.replace(/[_ /?%#]/g, (ch) => {
      switch (ch) {
        case "_":
          return "__";
        case " ":
          return "_";
        case "/":
          return "~s";
        case "?":
          return "~q";
        case "%":
          return "~p";
        case "#":
          return "~h";
        default:
          return ch;
      }
    });
  }
  const encodedLines = lines.map(encodeMemeText);
  const path = encodedLines.length > 0 ? encodedLines.join("/") : "_";
  return `${MEMEGEN_API_BASE}/images/${encodeURIComponent(templateId)}/${path}.${format}`;
}

/**
 * Downloads an image from `url`, uploads it to the Supabase meme-images bucket
 * with a UUID filename, and returns the public Supabase URL. Returns null on any failure.
 */
async function downloadAndCacheImage(
  url: string,
  timeoutMs = IMAGE_VERIFY_TIMEOUT_MS,
): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    let res: Response;
    try {
      res = await fetch(url, {
        method: "GET",
        signal: controller.signal,
        redirect: "follow",
      });
    } catch {
      return null;
    }

    if (!res.ok) return null;

    const contentType = res.headers.get("content-type") ?? "";
    const mimeType = contentType.split(";")[0].trim();

    const ext = CONTENT_TYPE_TO_EXT[mimeType];
    if (!ext) return null;

    const contentLength = res.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MEME_MAX_BYTES) return null;

    const fileName = `${crypto.randomUUID()}${ext}`;

    let arrayBuffer: ArrayBuffer;
    try {
      arrayBuffer = await res.arrayBuffer();
    } catch {
      return null;
    }

    if (arrayBuffer.byteLength > MEME_MAX_BYTES) return null;

    const supabase = createAdminClient();
    const { error } = await supabase.storage
      .from(MEME_BUCKET)
      .upload(fileName, arrayBuffer, {
        contentType: mimeType,
        upsert: false,
      });

    if (error) {
      logger.warn("Failed to upload meme image to Supabase storage", {
        url,
        error: error.message,
      });
      return null;
    }

    const { data: urlData } = supabase.storage
      .from(MEME_BUCKET)
      .getPublicUrl(fileName);

    return urlData.publicUrl;
  } finally {
    clearTimeout(timeout);
  }
}

export interface CreateEventToolsParams {
  octokit: Octokit;
  org: string;
  repo: string;
}

/**
 * Creates agent tools bound to a repo context for use in event processors.
 * Tools allow the model to explore files and access PR details on demand.
 */
export function createEventTools({
  octokit,
  org,
  repo,
}: CreateEventToolsParams) {
  return {
    explore_file: tool({
      description:
        "Read the content of a file or list files in a directory at a specific git ref (commit sha or tag). Use this to gain more context about code changes.",
      inputSchema: z.object({
        path: z
          .string()
          .describe("File path (e.g. src/index.ts) or directory path"),
        ref: z
          .string()
          .describe("Git ref: commit SHA or tag name (e.g. abc123 or v1.0.0)"),
      }),
      execute: async ({ path, ref }: { path: string; ref: string }) => {
        try {
          logger.info("Exploring file", { org, repo, path, ref });
          const { data } = await octokit.repos.getContent({
            owner: org,
            repo,
            path,
            ref,
          });

          if (Array.isArray(data)) {
            const entries = data.map(
              (item) =>
                `${item.type === "dir" ? "📁" : "📄"} ${item.path}${item.type === "dir" ? "/" : ""}`,
            );
            return { entries };
          }

          if (!("content" in data) || !data.content) {
            return { error: "File is empty or binary" };
          }

          const content = Buffer.from(data.content, "base64").toString("utf-8");
          if (content.length > MAX_FILE_CONTENT_BYTES) {
            return {
              content:
                content.slice(0, MAX_FILE_CONTENT_BYTES) +
                "\n\n... [truncated, file too large]",
            };
          }
          return { content };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch file";
          return { error: message };
        }
      },
    }),

    compare_refs: tool({
      description:
        "Compare two git refs (commit SHAs or tag names) to see what changed between them. Use for releases (e.g. v1.0...v2.0) or any base...head comparison. Returns commits, changed files, and diff.",
      inputSchema: z.object({
        base: z
          .string()
          .describe("Base ref: commit SHA or tag (e.g. abc123 or v1.0.0)"),
        head: z
          .string()
          .describe("Head ref: commit SHA or tag (e.g. def456 or v2.0.0)"),
      }),
      execute: async ({ base, head }: { base: string; head: string }) => {
        try {
          logger.info("Comparing refs", { org, repo, base, head });
          const basehead = `${base}...${head}`;
          const { data } = await octokit.repos.compareCommitsWithBasehead({
            owner: org,
            repo,
            basehead,
          });

          const { filteredFiles, diff: combinedDiff } = filterAndFormatDiff(
            data.files ?? [],
          );

          let diff = combinedDiff;
          if (diff.length > MAX_FILE_CONTENT_BYTES * 2) {
            diff =
              diff.slice(0, MAX_FILE_CONTENT_BYTES * 2) +
              "\n\n... [diff truncated]";
          }

          const commitSummaries = (data.commits ?? [])
            .map(
              (c) =>
                `- ${c.sha?.slice(0, 7) ?? "?"} ${c.commit?.message?.split("\n")[0] ?? ""} (${c.commit?.author?.name ?? "unknown"})`,
            )
            .join("\n");

          return {
            status: data.status,
            ahead_by: data.ahead_by,
            behind_by: data.behind_by,
            total_commits: data.total_commits,
            changed_files: filteredFiles.map((f) => f.filename),
            commits: commitSummaries || "No commits",
            diff: diff || "No diff (e.g. refs are identical)",
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to compare refs";
          return { error: message };
        }
      },
    }),

    get_commit: tool({
      description:
        "Get details of a single commit by ref (SHA or tag): message, author, date, and changed files with diff.",
      inputSchema: z.object({
        ref: z
          .string()
          .describe("Git ref: commit SHA or tag name (e.g. abc123 or v1.0.0)"),
      }),
      execute: async ({ ref }: { ref: string }) => {
        try {
          logger.info("Getting commit", { org, repo, ref });
          const { data } = await octokit.repos.getCommit({
            owner: org,
            repo,
            ref,
          });

          const { filteredFiles, diff: combinedDiff } = filterAndFormatDiff(
            data.files ?? [],
          );

          let diff = combinedDiff;
          if (diff.length > MAX_FILE_CONTENT_BYTES * 2) {
            diff =
              diff.slice(0, MAX_FILE_CONTENT_BYTES * 2) +
              "\n\n... [diff truncated]";
          }

          const commit = data.commit;
          return {
            sha: data.sha,
            message: commit?.message ?? "",
            author: commit?.author?.name ?? data.author?.login ?? "unknown",
            authored_at: commit?.author?.date,
            changed_files: filteredFiles.map((f) => f.filename),
            diff: diff || "No diff",
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch commit";
          return { error: message };
        }
      },
    }),

    find_meme: tool({
      description:
        "Search for a relevant, appropriate meme image via Tavily. " +
        "Use when the update merits a humorous or illustrative meme " +
        "(e.g. merge conflict, breaking change, big refactor). " +
        "Only use professional, developer-appropriate, SFW memes. " +
        "Returns verified image URLs. Include returned URLs in your summary as " +
        "markdown images using the exact url string from the response, do not modify or truncate it: ![caption](url). " +
        "IMPORTANT: The URL must be used exactly as returned, including the full file extension (e.g. .jpg, .png, .gif). " +
        "Never drop or omit the file extension from the URL.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "Search query for the meme " +
              "(e.g. 'merge conflict developer meme SFW', 'breaking change professional meme')",
          ),
      }),
      execute: async ({ query }: { query: string }) => {
        try {
          const client = createTavilyClient();
          logger.info("Finding meme", { org, repo, query });
          const response = await client.search(query, {
            includeImages: true,
            includeImageDescriptions: true,
            maxResults: 5,
            searchDepth: "basic",
          });
          const rawImages = response.images ?? [];
          const verified: { url: string; description?: string }[] = [];
          for (const img of rawImages) {
            if (verified.length >= MAX_VERIFIED_IMAGES) break;
            const { url, description } = img;
            if (url && url.startsWith("https:")) {
              const cachedUrl = await downloadAndCacheImage(url);
              if (cachedUrl) {
                verified.push({ url: cachedUrl, description });
              }
            }
          }
          return { images: verified };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to search for memes";
          logger.warn("find_meme failed", { org, repo, error: message });
          return { images: [], error: message };
        }
      },
    }),

    search_meme_templates: tool({
      description:
        "Search for blank meme templates from the memegen.link library. " +
        "Returns template IDs, names, and example image URLs. " +
        "Use this before write_on_meme_template to find the right template for the situation.",
      inputSchema: z.object({
        query: z
          .string()
          .describe(
            "Search query to filter templates by name " +
              "(e.g. 'distracted boyfriend', 'drake', 'this is fine')",
          ),
      }),
      execute: async ({ query }: { query: string }) => {
        try {
          logger.info("Searching meme templates", { org, repo, query });
          const res = await fetch(`${MEMEGEN_API_BASE}/templates`);
          if (!res.ok) {
            return {
              templates: [],
              error: `Failed to fetch templates: ${res.status}`,
            };
          }
          const allTemplates: {
            id: string;
            name: string;
            example: { url?: string };
          }[] = await res.json();
          const lower = query.toLowerCase();
          const matched = allTemplates
            .filter((t) => t.name.toLowerCase().includes(lower))
            .slice(0, MEMEGEN_TEMPLATES_LIMIT)
            .map((t) => ({
              id: t.id,
              name: t.name,
              example_url: t.example?.url ?? null,
            }));
          return { templates: matched };
        } catch (err) {
          const message =
            err instanceof Error
              ? err.message
              : "Failed to search meme templates";
          logger.warn("search_meme_templates failed", {
            org,
            repo,
            error: message,
          });
          return { templates: [], error: message };
        }
      },
    }),

    write_on_meme_template: tool({
      description:
        "Generate a meme by overlaying custom text lines on a blank meme template. " +
        "Use search_meme_templates first to find a suitable template ID. " +
        "Returns a Supabase-hosted URL of the generated meme image, which you can embed in your summary " +
        "as markdown: ![caption](url). " +
        "Tailor the text to the repository and commit context for maximum relevance and humor.",
      inputSchema: z.object({
        template_id: z
          .string()
          .describe(
            "Template ID from search_meme_templates (e.g. 'doge', 'drake', 'buzz')",
          ),
        lines: z
          .array(z.string())
          .describe(
            "Text lines to overlay on the template, in order (top to bottom). " +
              "Use concise, developer-appropriate text.",
          ),
        format: z
          .enum(MEME_IMAGE_FORMATS)
          .default("png")
          .describe(
            "Output format for generated meme. Use gif/webp when template or text animation is desired.",
          ),
      }),
      execute: async ({
        template_id,
        lines,
        format,
      }: {
        template_id: string;
        lines: string[];
        format: MemeImageFormat;
      }) => {
        try {
          logger.info("Creating meme", {
            org,
            repo,
            template_id,
            lines,
            format,
          });
          const source_url = buildMemeUrl(template_id, lines, format);
          const url = await persistMemeImage({
            sourceUrl: source_url,
            org,
            repo,
            templateId: template_id,
          });
          return { url, source_url };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to create meme";
          logger.warn("write_on_meme_template failed", {
            org,
            repo,
            error: message,
          });
          return { error: message };
        }
      },
    }),

    get_pull_request: tool({
      description:
        "Get full details of a pull request by number: title, body, reviews, changed files, and diff. Useful when you need PR context (e.g. for releases that reference merged PRs).",
      inputSchema: z.object({
        pull_number: z.number().describe("Pull request number"),
      }),
      execute: async ({ pull_number }: { pull_number: number }) => {
        try {
          logger.info("Getting pull request", { org, repo, pull_number });

          const [prData, reviews, filesData] = await Promise.all([
            octokit.pulls.get({
              owner: org,
              repo,
              pull_number,
            }),
            octokit.pulls.listReviews({
              owner: org,
              repo,
              pull_number,
            }),
            octokit.pulls.listFiles({
              owner: org,
              repo,
              pull_number,
            }),
          ]);

          const { data: pr } = prData;
          const reviewSummaries = reviews.data
            .map(
              (r) =>
                `- ${r.user?.login ?? "unknown"} [${r.state}]: ${r.body ? r.body.substring(0, 200) : "No comment"}`,
            )
            .join("\n");

          const { filteredFiles, diff: combinedDiff } = filterAndFormatDiff(
            filesData.data,
          );

          let diff = combinedDiff;
          if (diff.length > MAX_FILE_CONTENT_BYTES * 2) {
            diff =
              diff.slice(0, MAX_FILE_CONTENT_BYTES * 2) +
              "\n\n... [diff truncated]";
          }

          return {
            title: pr.title,
            body: pr.body,
            author: pr.user.login,
            reviews: reviewSummaries || "No reviews",
            changed_files: filteredFiles.map((f) => f.filename),
            diff: diff || "No diff available",
          };
        } catch (err) {
          const message =
            err instanceof Error ? err.message : "Failed to fetch PR";
          return { error: message };
        }
      },
    }),
  };
}
