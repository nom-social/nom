import { describe, expect, it } from "vitest";

import {
  prDataSchema,
  pushDataSchema,
  releaseDataSchema,
  timelineItemDataSchema,
} from "./schemas";

const validPrPayload = {
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

const validReleasePayload = {
  type: "release" as const,
  action: "published",
  release: {
    tag_name: "v1.0.0",
    name: "Release 1.0",
    body: "Release notes",
    html_url: "https://github.com/org/repo/releases/tag/v1.0.0",
    created_at: "2024-01-01T00:00:00Z",
    published_at: "2024-01-01T12:00:00Z",
    author: { login: "alice" },
    assets: [
      {
        name: "app.zip",
        size: 1024,
        download_count: 5,
        content_type: "application/zip",
        browser_download_url:
          "https://github.com/org/repo/releases/download/v1.0.0/app.zip",
      },
    ],
    contributors: ["alice"],
    ai_summary: "First release.",
  },
};

const validPushPayload = {
  type: "push" as const,
  push: {
    ai_summary: "Pushed changes.",
    contributors: ["alice"],
    title: "Update feature",
    html_url: "https://github.com/org/repo/commit/abc",
    created_at: "2024-01-01T00:00:00Z",
  },
};

describe("prDataSchema", () => {
  it("accepts a valid PR payload", () => {
    const result = prDataSchema.parse(validPrPayload);
    expect(result.pull_request.title).toBe("Fix bug");
    expect(result.pull_request.contributors).toEqual(["alice", "bob"]);
  });

  it("allows requested_reviewers to be omitted", () => {
    const { ...prWithout } = validPrPayload.pull_request as {
      requested_reviewers?: unknown;
      [k: string]: unknown;
    };
    const result = prDataSchema.parse({
      action: validPrPayload.action,
      pull_request: prWithout,
    });
    expect(result.pull_request).toBeDefined();
  });

  it("rejects missing required nested fields", () => {
    const invalidPr = { ...validPrPayload.pull_request };
    delete (invalidPr as Record<string, unknown>).stats;
    expect(() =>
      prDataSchema.parse({
        action: validPrPayload.action,
        pull_request: invalidPr,
      })
    ).toThrow();
  });
});

describe("releaseDataSchema", () => {
  it("accepts a valid release payload", () => {
    const result = releaseDataSchema.parse(validReleasePayload);
    expect(result.release.tag_name).toBe("v1.0.0");
    expect(result.release.name).toBe("Release 1.0");
  });

  it("accepts name and published_at as null", () => {
    const payload = {
      ...validReleasePayload,
      release: {
        ...validReleasePayload.release,
        name: null,
        published_at: null,
      },
    };
    const result = releaseDataSchema.parse(payload);
    expect(result.release.name).toBeNull();
    expect(result.release.published_at).toBeNull();
  });
});

describe("pushDataSchema", () => {
  it("accepts a valid push payload", () => {
    const result = pushDataSchema.parse(validPushPayload);
    expect(result.push.title).toBe("Update feature");
    expect(result.push.contributors).toEqual(["alice"]);
  });

  it("rejects wrong primitive types", () => {
    expect(() =>
      pushDataSchema.parse({
        push: { ...validPushPayload.push, contributors: "alice" },
      })
    ).toThrow();
  });
});

describe("timelineItemDataSchema", () => {
  it("accepts valid pull_request payload", () => {
    const result = timelineItemDataSchema.parse(validPrPayload);
    expect(result.type).toBe("pull_request");
    if (result.type === "pull_request") {
      expect(result.pull_request.title).toBe("Fix bug");
    }
  });

  it("accepts valid release payload", () => {
    const result = timelineItemDataSchema.parse(validReleasePayload);
    expect(result.type).toBe("release");
    if (result.type === "release") {
      expect(result.release.tag_name).toBe("v1.0.0");
    }
  });

  it("accepts valid push payload", () => {
    const result = timelineItemDataSchema.parse(validPushPayload);
    expect(result.type).toBe("push");
    if (result.type === "push") {
      expect(result.push.title).toBe("Update feature");
    }
  });

  it("rejects mismatched discriminator (push type with release-shaped data)", () => {
    expect(() =>
      timelineItemDataSchema.parse({
        type: "push",
        release: validReleasePayload.release,
      })
    ).toThrow();
  });

  it("rejects unknown type", () => {
    expect(() =>
      timelineItemDataSchema.parse({ type: "unknown", action: "test" })
    ).toThrow();
  });
});
