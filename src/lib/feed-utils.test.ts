import { describe, expect, it } from "vitest";

import { parseSearchFilters } from "./feed-utils";

describe("parseSearchFilters", () => {
  it("returns empty textQuery when query is empty or whitespace", () => {
    expect(parseSearchFilters()).toEqual({ textQuery: "" });
    expect(parseSearchFilters("")).toEqual({ textQuery: "" });
    expect(parseSearchFilters("   ")).toEqual({ textQuery: "" });
  });

  it("parses org filter", () => {
    const result = parseSearchFilters("org:my-org");
    expect(result.org).toBe("my-org");
    expect(result.textQuery).toBe("");
  });

  it("parses repo filter", () => {
    const result = parseSearchFilters("repo:my-repo");
    expect(result.repo).toBe("my-repo");
  });

  it("parses type filter", () => {
    const result = parseSearchFilters("type:pull_request");
    expect(result.type).toBe("pull_request");
  });

  it("parses from and to filters", () => {
    const result = parseSearchFilters("from:2024-01-01 to:2024-12-31");
    expect(result.from).toBe("2024-01-01");
    expect(result.to).toBe("2024-12-31");
  });

  it("parses owner filter", () => {
    const result = parseSearchFilters("owner:acme");
    expect(result.owner).toBe("acme");
  });

  it("uses last match when filter appears multiple times", () => {
    const result = parseSearchFilters("org:first org:second");
    expect(result.org).toBe("second");
  });

  it("preserves free-text after stripping structured filters", () => {
    const result = parseSearchFilters("org:my-org hello world");
    expect(result.org).toBe("my-org");
    expect(result.textQuery).toBe("hello world");
  });
});
