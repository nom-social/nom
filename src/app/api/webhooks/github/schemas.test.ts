import { describe, expect, it } from "vitest";

import { githubWebhookPayloadSchema } from "./schemas";

const baseRepo = {
  id: 1,
  name: "repo",
  full_name: "org/repo",
  owner: { login: "owner", id: 1 },
  default_branch: "main",
};

describe("githubWebhookPayloadSchema", () => {
  it("accepts minimal valid ping payload", () => {
    const payload = {
      event_type: "ping" as const,
      repository: baseRepo,
    };
    const result = githubWebhookPayloadSchema.parse(payload);
    expect(result.event_type).toBe("ping");
  });

  it("accepts valid star payload with created action", () => {
    const payload = {
      event_type: "star" as const,
      action: "created" as const,
      repository: baseRepo,
      sender: { login: "user", id: 2 },
    };
    const result = githubWebhookPayloadSchema.parse(payload);
    expect(result.event_type).toBe("star");
    expect(result.action).toBe("created");
  });

  it("accepts valid star payload with deleted action", () => {
    const payload = {
      event_type: "star" as const,
      action: "deleted" as const,
      repository: baseRepo,
      sender: { login: "user", id: 2 },
    };
    const result = githubWebhookPayloadSchema.parse(payload);
    expect(result.action).toBe("deleted");
  });

  it("rejects invalid star action", () => {
    const payload = {
      event_type: "star" as const,
      action: "updated",
      repository: baseRepo,
      sender: { login: "user", id: 2 },
    };
    expect(() => githubWebhookPayloadSchema.parse(payload)).toThrow();
  });

  it("accepts valid pull_request payload", () => {
    const payload = {
      event_type: "pull_request" as const,
      action: "closed" as const,
      repository: baseRepo,
    };
    const result = githubWebhookPayloadSchema.parse(payload);
    expect(result.event_type).toBe("pull_request");
  });

  it("accepts valid push payload with ref", () => {
    const payload = {
      event_type: "push" as const,
      ref: "refs/heads/main",
      repository: baseRepo,
    };
    const result = githubWebhookPayloadSchema.parse(payload);
    expect(result.event_type).toBe("push");
    if (result.event_type === "push") {
      expect(result.ref).toBe("refs/heads/main");
    }
  });

  it("accepts valid release payload", () => {
    const payload = {
      event_type: "release" as const,
      repository: baseRepo,
    };
    const result = githubWebhookPayloadSchema.parse(payload);
    expect(result.event_type).toBe("release");
  });

  it("accepts valid installation payload", () => {
    const payload = {
      event_type: "installation" as const,
      repositories: [{ full_name: "org/repo" }],
      sender: { login: "user", id: 2 },
      installation: { id: 123 },
    };
    const result = githubWebhookPayloadSchema.parse(payload);
    expect(result.event_type).toBe("installation");
  });

  it("accepts valid installation_repositories payload", () => {
    const payload = {
      event_type: "installation_repositories" as const,
      repositories_added: [{ full_name: "org/new-repo" }],
      repositories_removed: [{ full_name: "org/old-repo" }],
      sender: { login: "user", id: 2 },
      installation: { id: 123 },
    };
    const result = githubWebhookPayloadSchema.parse(payload);
    expect(result.event_type).toBe("installation_repositories");
  });

  it("accepts valid repository payload", () => {
    const payload = {
      event_type: "repository" as const,
      action: "created",
      repository: baseRepo,
      sender: { login: "user", id: 2 },
    };
    const result = githubWebhookPayloadSchema.parse(payload);
    expect(result.event_type).toBe("repository");
  });

  it("rejects missing repository", () => {
    const payload = {
      event_type: "ping" as const,
    };
    expect(() => githubWebhookPayloadSchema.parse(payload)).toThrow();
  });

  it("rejects unknown event_type", () => {
    const payload = {
      event_type: "unknown",
      repository: baseRepo,
    };
    expect(() => githubWebhookPayloadSchema.parse(payload)).toThrow();
  });
});
