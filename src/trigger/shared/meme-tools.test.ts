import { describe, expect, it } from "vitest";

import { encodeMemeText, buildMemeUrl } from "./agent-tools";

describe("encodeMemeText", () => {
  it("encodes spaces as underscores", () => {
    expect(encodeMemeText("hello world")).toBe("hello_world");
  });

  it("encodes literal underscores as double underscores", () => {
    expect(encodeMemeText("snake_case")).toBe("snake__case");
  });

  it("encodes slashes as ~s", () => {
    expect(encodeMemeText("and/or")).toBe("and~sor");
  });

  it("encodes question marks as ~q", () => {
    expect(encodeMemeText("why?")).toBe("why~q");
  });

  it("encodes percent signs as ~p", () => {
    expect(encodeMemeText("100%")).toBe("100~p");
  });

  it("encodes hash signs as ~h", () => {
    expect(encodeMemeText("#1")).toBe("~h1");
  });

  it("handles mixed special characters", () => {
    expect(encodeMemeText("it works? 100% sure")).toBe("it_works~q_100~p_sure");
  });

  it("handles empty string", () => {
    expect(encodeMemeText("")).toBe("");
  });
});

describe("buildMemeUrl", () => {
  it("builds a URL with a single line", () => {
    expect(buildMemeUrl("doge", ["much wow"])).toBe(
      "https://api.memegen.link/images/doge/much_wow.png",
    );
  });

  it("builds a URL with two lines", () => {
    expect(buildMemeUrl("drake", ["old find_meme", "new create_meme"])).toBe(
      "https://api.memegen.link/images/drake/old_find__meme/new_create__meme.png",
    );
  });

  it("uses _ placeholder when lines is empty", () => {
    expect(buildMemeUrl("buzz", [])).toBe(
      "https://api.memegen.link/images/buzz/_.png",
    );
  });

  it("URL-encodes template IDs that contain special characters", () => {
    const url = buildMemeUrl("my template", ["text"]);
    expect(url).toContain("my%20template");
  });
});
