import { describe, expect, it } from "vitest";

import {
  buildCustomBackgroundMemeUrl,
  buildMemeTemplatesSearchUrl,
  buildMemeUrl,
} from "./agent-tools";

describe("buildMemeUrl", () => {
  it("encodes spaces as underscores", () => {
    expect(buildMemeUrl("t", ["hello world"])).toBe(
      "https://api.memegen.link/images/t/hello_world.png",
    );
  });

  it("encodes literal underscores as double underscores", () => {
    expect(buildMemeUrl("t", ["snake_case"])).toBe(
      "https://api.memegen.link/images/t/snake__case.png",
    );
  });

  it("encodes slashes as ~s", () => {
    expect(buildMemeUrl("t", ["and/or"])).toBe(
      "https://api.memegen.link/images/t/and~sor.png",
    );
  });

  it("encodes question marks as ~q", () => {
    expect(buildMemeUrl("t", ["why?"])).toBe(
      "https://api.memegen.link/images/t/why~q.png",
    );
  });

  it("encodes percent signs as ~p", () => {
    expect(buildMemeUrl("t", ["100%"])).toBe(
      "https://api.memegen.link/images/t/100~p.png",
    );
  });

  it("encodes hash signs as ~h", () => {
    expect(buildMemeUrl("t", ["#1"])).toBe(
      "https://api.memegen.link/images/t/~h1.png",
    );
  });

  it("handles mixed special characters", () => {
    expect(buildMemeUrl("t", ["it works? 100% sure"])).toBe(
      "https://api.memegen.link/images/t/it_works~q_100~p_sure.png",
    );
  });

  it("handles empty line text", () => {
    expect(buildMemeUrl("t", [""])).toBe(
      "https://api.memegen.link/images/t/.png",
    );
  });

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

  it("supports jpg output format", () => {
    expect(buildMemeUrl("ds", ["high quality", "small file"], "jpg")).toBe(
      "https://api.memegen.link/images/ds/high_quality/small_file.jpg",
    );
  });

  it("supports gif output format", () => {
    expect(buildMemeUrl("iw", ["animates text", "in production"], "gif")).toBe(
      "https://api.memegen.link/images/iw/animates_text/in_production.gif",
    );
  });

  it("supports webp output format", () => {
    expect(buildMemeUrl("oprah", ["you get", "animated text"], "webp")).toBe(
      "https://api.memegen.link/images/oprah/you_get/animated_text.webp",
    );
  });
});

describe("buildCustomBackgroundMemeUrl", () => {
  it("builds custom background URL with encoded background query param", () => {
    expect(
      buildCustomBackgroundMemeUrl(
        ["top text", "bottom text"],
        "https://example.com/meme image.png?x=1&y=2",
      ),
    ).toBe(
      "https://api.memegen.link/images/custom/top_text/bottom_text.png?background=https%3A%2F%2Fexample.com%2Fmeme%20image.png%3Fx%3D1%26y%3D2",
    );
  });

  it("supports alternate output formats", () => {
    expect(
      buildCustomBackgroundMemeUrl(
        ["you get", "animated text"],
        "http://www.gstatic.com/webp/gallery/1.png",
        "webp",
      ),
    ).toBe(
      "https://api.memegen.link/images/custom/you_get/animated_text.webp?background=http%3A%2F%2Fwww.gstatic.com%2Fwebp%2Fgallery%2F1.png",
    );
  });
});

describe("buildMemeTemplatesSearchUrl", () => {
  it("URL-encodes filter query for memegen templates endpoint", () => {
    expect(buildMemeTemplatesSearchUrl("drake & cat memes")).toBe(
      "https://api.memegen.link/templates?filter=drake%20%26%20cat%20memes",
    );
  });
});
