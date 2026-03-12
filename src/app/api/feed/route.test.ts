import { describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";

import { GET } from "./route";

const mockFetchQuery = vi.hoisted(() => vi.fn());

vi.mock("convex/nextjs", () => ({
  fetchQuery: mockFetchQuery,
}));

vi.mock("@/../convex/_generated/api", () => ({
  api: {
    admin: {
      getPublicFeedSlice: "admin:getPublicFeedSlice",
    },
  },
}));

function createRequest(url: string): NextRequest {
  return new NextRequest(url);
}

describe("GET /api/feed", () => {
  it("uses default limit 5 and offset 0", async () => {
    mockFetchQuery.mockResolvedValue([]);

    const req = createRequest("http://localhost/api/feed");
    const res = await GET(req);
    const json = await res.json();
    expect(json.pagination).toEqual({
      offset: 0,
      limit: 5,
      has_more: false,
    });
  });

  it("caps limit at 100", async () => {
    mockFetchQuery.mockResolvedValue([]);

    const req = createRequest("http://localhost/api/feed?limit=200&offset=0");
    const res = await GET(req);
    const json = await res.json();
    expect(json.pagination.limit).toBe(100);
  });

  it("returns 500 on DB error", async () => {
    mockFetchQuery.mockRejectedValue(new Error("DB error"));

    const req = createRequest("http://localhost/api/feed");
    const res = await GET(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DB error");
  });

  it("returns items and has_more when length equals limit", async () => {
    const mockItems = [
      {
        _id: "1",
        type: "push",
        data: {},
        dedupeHash: "abc",
        updatedAt: Date.now(),
        repository: { org: "org", repo: "repo" },
      },
    ];
    mockFetchQuery.mockResolvedValue(mockItems);

    const req = createRequest("http://localhost/api/feed?limit=1&offset=0");
    const res = await GET(req);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.pagination.has_more).toBe(true);
  });
});
