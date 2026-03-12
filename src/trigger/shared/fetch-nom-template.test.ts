import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_INSTRUCTIONS,
  fetchNomInstructions,
} from "./fetch-nom-template";

/** Wraps partial Octokit mock for fetchNomInstructions; cast required for vi.fn(). */
function asOctokitMock(mock: {
  repos: { getContent: ReturnType<typeof vi.fn> };
}): Parameters<typeof fetchNomInstructions>[0]["octokit"] {
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions -- partial mock for Octokit
  return mock as unknown as Parameters<
    typeof fetchNomInstructions
  >[0]["octokit"];
}

describe("fetchNomInstructions", () => {
  it("returns repo-specific instructions when .nom file exists", async () => {
    const customContent = "Custom instructions for this repo.";
    const octokit = {
      repos: {
        getContent: vi.fn().mockResolvedValue({
          data: { content: Buffer.from(customContent).toString("base64") },
        }),
      },
    };
    const result = await fetchNomInstructions({
      eventType: "pull_request",
      repo: { org: "my-org", repo: "my-repo" },
      octokit: asOctokitMock(octokit),
    });
    expect(result).toBe(customContent);
    expect(octokit.repos.getContent).toHaveBeenCalledWith({
      owner: "my-org",
      repo: "my-repo",
      path: ".nom/pull_request_instructions.md",
    });
  });

  it("falls back to default when getContent returns directory (array)", async () => {
    const octokit = {
      repos: {
        getContent: vi.fn().mockResolvedValue({
          data: [{ name: "something" }],
        }),
      },
    };
    const result = await fetchNomInstructions({
      eventType: "push",
      repo: { org: "org", repo: "repo" },
      octokit: asOctokitMock(octokit),
    });
    expect(result).toBe(DEFAULT_INSTRUCTIONS.push);
  });

  it("falls back to default when content exceeds 6000 chars", async () => {
    const longContent = "x".repeat(7000);
    const octokit = {
      repos: {
        getContent: vi.fn().mockResolvedValue({
          data: { content: Buffer.from(longContent).toString("base64") },
        }),
      },
    };
    const result = await fetchNomInstructions({
      eventType: "release",
      repo: { org: "org", repo: "repo" },
      octokit: asOctokitMock(octokit),
    });
    expect(result).toBe(DEFAULT_INSTRUCTIONS.release);
  });

  it("falls back to default when getContent throws", async () => {
    const octokit = {
      repos: {
        getContent: vi.fn().mockRejectedValue(new Error("Not found")),
      },
    };
    const result = await fetchNomInstructions({
      eventType: "pull_request",
      repo: { org: "org", repo: "repo" },
      octokit: asOctokitMock(octokit),
    });
    expect(result).toBe(DEFAULT_INSTRUCTIONS.pull_request);
  });

  it("returns correct default for each event type", async () => {
    const octokit = {
      repos: {
        getContent: vi.fn().mockRejectedValue(new Error("Not found")),
      },
    };
    const pr = await fetchNomInstructions({
      eventType: "pull_request",
      repo: { org: "x", repo: "y" },
      octokit: asOctokitMock(octokit),
    });
    const push = await fetchNomInstructions({
      eventType: "push",
      repo: { org: "x", repo: "y" },
      octokit: asOctokitMock(octokit),
    });
    const release = await fetchNomInstructions({
      eventType: "release",
      repo: { org: "x", repo: "y" },
      octokit: asOctokitMock(octokit),
    });
    expect(pr).toBe(DEFAULT_INSTRUCTIONS.pull_request);
    expect(push).toBe(DEFAULT_INSTRUCTIONS.push);
    expect(release).toBe(DEFAULT_INSTRUCTIONS.release);
    expect(pr).not.toBe(push);
  });
});
