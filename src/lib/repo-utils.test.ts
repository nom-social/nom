import { describe, expect, it } from "vitest";

import { escapeForIlike } from "./repo-utils";

describe("escapeForIlike", () => {
  it("leaves ordinary strings unchanged", () => {
    expect(escapeForIlike("foo")).toBe("foo");
    expect(escapeForIlike("hello-world")).toBe("hello-world");
    expect(escapeForIlike("abc123")).toBe("abc123");
  });

  it("escapes % as \\%", () => {
    expect(escapeForIlike("foo%bar")).toBe("foo\\%bar");
    expect(escapeForIlike("%")).toBe("\\%");
  });

  it("escapes _ as \\_", () => {
    expect(escapeForIlike("foo_bar")).toBe("foo\\_bar");
    expect(escapeForIlike("_")).toBe("\\_");
  });

  it("escapes \\ as \\\\", () => {
    expect(escapeForIlike("foo\\bar")).toBe("foo\\\\bar");
    expect(escapeForIlike("\\")).toBe("\\\\");
  });

  it("escapes mixed strings correctly (order: \\, %, _)", () => {
    expect(escapeForIlike("foo%_\\bar")).toBe("foo\\%\\_\\\\bar");
    expect(escapeForIlike("\\_%")).toBe("\\\\\\_\\%");
  });

  it("returns empty string for empty input", () => {
    expect(escapeForIlike("")).toBe("");
  });
});
