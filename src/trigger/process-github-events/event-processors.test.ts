import { describe, expect, it, vi } from "vitest";

import { processEvent } from "./event-processors";
import { processPullRequestEvent } from "./event-processors/pull-request";
import { processReleaseEvent } from "./event-processors/release";
import { processPushEvent } from "./event-processors/push";

vi.mock("./event-processors/pull-request", () => ({
  processPullRequestEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./event-processors/release", () => ({
  processReleaseEvent: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("./event-processors/push", () => ({
  processPushEvent: vi.fn().mockResolvedValue(undefined),
}));

const baseArgs = {
  event: { event_type: "", raw_payload: {}, id: "evt-1" },
  repo: { repo: "my-repo", org: "my-org", id: "repo-1" },
  subscribers: [{ user_id: "user-1" }],
};

describe("processEvent", () => {
  it("dispatches pull_request to processPullRequestEvent", async () => {
    await processEvent({
      ...baseArgs,
      event: { ...baseArgs.event, event_type: "pull_request" },
    });
    expect(processPullRequestEvent).toHaveBeenCalledWith({
      ...baseArgs,
      event: { ...baseArgs.event, event_type: "pull_request" },
    });
  });

  it("dispatches release to processReleaseEvent", async () => {
    await processEvent({
      ...baseArgs,
      event: { ...baseArgs.event, event_type: "release" },
    });
    expect(processReleaseEvent).toHaveBeenCalledWith({
      ...baseArgs,
      event: { ...baseArgs.event, event_type: "release" },
    });
  });

  it("dispatches push to processPushEvent", async () => {
    await processEvent({
      ...baseArgs,
      event: { ...baseArgs.event, event_type: "push" },
    });
    expect(processPushEvent).toHaveBeenCalledWith({
      ...baseArgs,
      event: { ...baseArgs.event, event_type: "push" },
    });
  });

  it("throws on unknown event type", async () => {
    await expect(
      processEvent({
        ...baseArgs,
        event: { ...baseArgs.event, event_type: "unknown" },
      }),
    ).rejects.toThrow("Unknown event type: unknown");
  });
});
