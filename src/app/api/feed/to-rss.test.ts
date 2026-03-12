import { describe, expect, it } from "vitest";

import { toErrorXml, toRssXml } from "./to-rss";

describe("toErrorXml", () => {
  it("escapes XML entities in message", () => {
    const result = toErrorXml("<script>alert('xss')</script>");
    expect(result).toContain("<message>");
    expect(result).toContain("&lt;script&gt;");
    expect(result).not.toContain("<script>");
  });

  it("returns valid error XML structure", () => {
    const result = toErrorXml("Something went wrong");
    expect(result).toMatch(/<\?xml/);
    expect(result).toContain("<error>");
    expect(result).toContain("<message>");
    expect(result).toContain("Something went wrong");
  });
});

describe("toRssXml", () => {
  it("emits channel metadata and atom self-link", () => {
    const result = toRssXml([], {
      title: "My Feed",
      link: "https://example.com",
      description: "A feed",
      feedUrl: "https://example.com/feed.xml",
    });
    expect(result).toContain("<title>My Feed</title>");
    expect(result).toContain("<link>https://example.com</link>");
    expect(result).toContain("atom:link");
  });

  it("uses Untitled when item title is empty", () => {
    const items = [
      {
        id: "1",
        type: "push",
        org: "org",
        repo: "repo",
        title: "",
        url: "https://example.com/1",
        author: "",
        summary: "",
        contributors: [],
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];
    const result = toRssXml(items, {
      title: "Feed",
      link: "https://example.com",
      description: "Desc",
      feedUrl: "https://example.com/feed.xml",
    });
    expect(result).toContain("<title>Untitled</title>");
  });

  it("prefixes description with author when author exists", () => {
    const items = [
      {
        id: "1",
        type: "push",
        org: "org",
        repo: "repo",
        title: "Update",
        url: "https://example.com/1",
        author: "alice",
        summary: "Fixed bug.",
        contributors: ["alice"],
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];
    const result = toRssXml(items, {
      title: "Feed",
      link: "https://example.com",
      description: "Desc",
      feedUrl: "https://example.com/feed.xml",
    });
    expect(result).toContain("By alice. Fixed bug.");
  });

  it("appends contributors when more than one", () => {
    const items = [
      {
        id: "1",
        type: "push",
        org: "org",
        repo: "repo",
        title: "Update",
        url: "https://example.com/1",
        author: "alice",
        summary: "Fixed bug.",
        contributors: ["alice", "bob", "carol"],
        updated_at: "2024-01-01T00:00:00Z",
      },
    ];
    const result = toRssXml(items, {
      title: "Feed",
      link: "https://example.com",
      description: "Desc",
      feedUrl: "https://example.com/feed.xml",
    });
    expect(result).toContain("Contributors: alice, bob, carol");
  });

  it("defaults language to en", () => {
    const result = toRssXml([], {
      title: "Feed",
      link: "https://example.com",
      description: "Desc",
      feedUrl: "https://example.com/feed.xml",
    });
    expect(result).toContain("<language>en</language>");
  });

  it("uses custom language when provided", () => {
    const result = toRssXml([], {
      title: "Feed",
      link: "https://example.com",
      description: "Desc",
      feedUrl: "https://example.com/feed.xml",
      language: "fr",
    });
    expect(result).toContain("<language>fr</language>");
  });
});
