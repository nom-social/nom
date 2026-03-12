import { describe, expect, it, vi } from "vitest";

import { NextRequest } from "next/server";

import { GET } from "./route";

const mockCreateClient = vi.hoisted(() => vi.fn());

vi.mock("@/utils/supabase/server", () => ({
  createClient: mockCreateClient,
}));

function createRequest(url: string): NextRequest {
  return new NextRequest(url);
}

function createChainableMock(result: {
  data: unknown[] | null;
  error: { message: string } | null;
}) {
  const chain = {
    eq: () => chain,
    gte: () => chain,
    lte: () => chain,
    textSearch: () => chain,
    order: () => chain,
    range: () => Promise.resolve(result),
  };
  return {
    from: () => ({
      select: () => chain,
    }),
  };
}

describe("GET /api/feed", () => {
  it("uses default limit 5 and offset 0", async () => {
    mockCreateClient.mockResolvedValue(
      createChainableMock({ data: [], error: null }),
    );

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
    const rangeSpy = vi.fn().mockResolvedValue({ data: [], error: null });
    const chain = {
      eq: () => chain,
      gte: () => chain,
      lte: () => chain,
      textSearch: () => chain,
      order: () => chain,
      range: rangeSpy,
    };
    mockCreateClient.mockResolvedValue({
      from: () => ({ select: () => chain }),
    });

    const req = createRequest("http://localhost/api/feed?limit=200&offset=0");
    await GET(req);
    // range(from, to) is inclusive, so limit 100 → to = 99
    expect(rangeSpy).toHaveBeenCalledWith(0, 99);
  });

  it("returns 500 on DB error", async () => {
    mockCreateClient.mockResolvedValue(
      createChainableMock({ data: null, error: { message: "DB error" } }),
    );

    const req = createRequest("http://localhost/api/feed");
    const res = await GET(req);
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DB error");
  });

  it("returns items and has_more when length equals limit", async () => {
    const mockItems = [
      {
        id: "1",
        type: "push",
        data: {},
        updated_at: "2024-01-01",
        org: "org",
        repo: "repo",
        repositories: { org: "org", repo: "repo" },
      },
    ];
    mockCreateClient.mockResolvedValue(
      createChainableMock({ data: mockItems, error: null }),
    );

    const req = createRequest("http://localhost/api/feed?limit=1&offset=0");
    const res = await GET(req);
    const json = await res.json();
    expect(json.items).toHaveLength(1);
    expect(json.pagination.has_more).toBe(true);
  });
});
