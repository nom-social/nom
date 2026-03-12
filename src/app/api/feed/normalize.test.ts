import { describe, expect, it } from "vitest";

import { normalizeTimelineItem } from "./normalize";

const baseItem = {
  id: "id-1",
  updated_at: "2024-01-01T00:00:00Z",
};

const validPrData = {
  type: "pull_request" as const,
  action: "closed",
  pull_request: {
    stats: { comments_count: 0, additions: 10, deletions: 2, changed_files: 3 },
    head_checks: { total: 2, passing: 2, failing: 0 },
    head: { ref: "main" },
    base: { ref: "develop" },
    user: { login: "alice" },
    number: 42,
    title: "Fix bug",
    body: null,
    html_url: "https://github.com/org/repo/pull/42",
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-02T00:00:00Z",
    ai_summary: "Fixed the bug.",
    merged: true,
    contributors: ["alice", "bob"],
  },
};

const validReleaseData = {
  type: "release" as const,
  action: "published",
  release: {
    tag_name: "v1.0.0",
    name: "Release 1.0",
    body: null,
    html_url: "https://github.com/org/repo/releases/tag/v1.0.0",
    created_at: "2024-01-01T00:00:00Z",
    published_at: "2024-01-01T12:00:00Z",
    author: { login: "alice" },
    assets: [],
    contributors: ["alice"],
    ai_summary: "First release.",
  },
};

const validPushData = {
  type: "push" as const,
  push: {
    ai_summary: "Pushed changes.",
    contributors: ["alice", "bob"],
    title: "Update feature",
    html_url: "https://github.com/org/repo/commit/abc",
    created_at: "2024-01-01T00:00:00Z",
  },
};

describe("normalizeTimelineItem", () => {
  it("normalizes pull_request item with title, url, author, summary, contributors", () => {
    const item = {
      ...baseItem,
      type: "pull_request",
      org: "my-org",
      repo: "my-repo",
      data: validPrData,
    };
    const result = normalizeTimelineItem(item);
    expect(result.title).toBe("Fix bug");
    expect(result.url).toBe("https://github.com/org/repo/pull/42");
    expect(result.author).toBe("alice");
    expect(result.summary).toBe("Fixed the bug.");
    expect(result.contributors).toEqual(["alice", "bob"]);
    expect(result.org).toBe("my-org");
    expect(result.repo).toBe("my-repo");
    expect(result.type).toBe("pull_request");
  });

  it("normalizes release item with name fallback to tag_name", () => {
    const item = {
      ...baseItem,
      type: "release",
      org: "org",
      repo: "repo",
      data: validReleaseData,
    };
    const result = normalizeTimelineItem(item);
    expect(result.title).toBe("Release 1.0");
    expect(result.url).toBe("https://github.com/org/repo/releases/tag/v1.0.0");
    expect(result.author).toBe("alice");
  });

  it("falls back to tag_name when release name is null", () => {
    const data = {
      ...validReleaseData,
      release: { ...validReleaseData.release, name: null },
    };
    const item = {
      ...baseItem,
      type: "release",
      org: "org",
      repo: "repo",
      data,
    };
    const result = normalizeTimelineItem(item);
    expect(result.title).toBe("v1.0.0");
  });

  it("normalizes push item with first contributor as author", () => {
    const item = {
      ...baseItem,
      type: "push",
      org: "org",
      repo: "repo",
      data: validPushData,
    };
    const result = normalizeTimelineItem(item);
    expect(result.title).toBe("Update feature");
    expect(result.author).toBe("alice");
    expect(result.contributors).toEqual(["alice", "bob"]);
  });

  it("uses repositories.org/repo as fallback when org/repo missing", () => {
    const item = {
      ...baseItem,
      type: "push",
      repositories: { org: "fallback-org", repo: "fallback-repo" },
      data: validPushData,
    };
    const result = normalizeTimelineItem(item);
    expect(result.org).toBe("fallback-org");
    expect(result.repo).toBe("fallback-repo");
  });

  it("overrides url with status URL when dedupe_hash is present", () => {
    const item = {
      ...baseItem,
      type: "pull_request",
      org: "my-org",
      repo: "my-repo",
      dedupe_hash: "abc123",
      data: validPrData,
    };
    const result = normalizeTimelineItem(item);
    expect(result.url).toMatch(/\/my-org\/my-repo\/status\/abc123$/);
  });

  it("returns empty derived fields when data is invalid", () => {
    const item = {
      ...baseItem,
      type: "pull_request",
      org: "org",
      repo: "repo",
      data: { invalid: "data" },
    };
    const result = normalizeTimelineItem(item);
    expect(result.title).toBe("");
    expect(result.url).toBe("");
    expect(result.author).toBe("");
    expect(result.summary).toBe("");
    expect(result.contributors).toEqual([]);
    expect(result.id).toBe("id-1");
    expect(result.type).toBe("pull_request");
  });

  it("returns empty derived fields when data is empty", () => {
    const item = {
      ...baseItem,
      type: "push",
      data: {},
    };
    const result = normalizeTimelineItem(item);
    expect(result.title).toBe("");
    expect(result.contributors).toEqual([]);
  });
});
