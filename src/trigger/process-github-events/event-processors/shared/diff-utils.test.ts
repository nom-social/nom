import { describe, expect, it } from "vitest";

import { filterAndFormatDiff } from "./diff-utils";

describe("filterAndFormatDiff", () => {
  it("filters out excluded file patterns", () => {
    const files = [
      { filename: "src/foo.ts", status: "modified", patch: "+change" },
      { filename: "yarn.lock", status: "modified", patch: "+lock" },
      { filename: "dist/index.js", status: "modified", patch: "+bundle" },
    ];
    const { filteredFiles } = filterAndFormatDiff(files);
    expect(filteredFiles).toHaveLength(1);
    expect(filteredFiles[0].filename).toBe("src/foo.ts");
  });

  it("filters out .d.ts and .map files", () => {
    const files = [
      { filename: "types.d.ts", status: "modified", patch: "" },
      { filename: "main.js.map", status: "modified", patch: "" },
    ];
    const { filteredFiles } = filterAndFormatDiff(files);
    expect(filteredFiles).toHaveLength(0);
  });

  it("formats renamed files with Renamed from and No content changes", () => {
    const files = [
      {
        filename: "new-name.ts",
        status: "renamed",
        previous_filename: "old-name.ts",
        patch: null,
      },
    ];
    const { filteredFiles, diff } = filterAndFormatDiff(files);
    expect(filteredFiles).toHaveLength(1);
    expect(diff).toContain("=== File: new-name.ts ===");
    expect(diff).toContain("Renamed from: old-name.ts");
    expect(diff).toContain("No content changes");
  });

  it("omits files without patch when not renamed", () => {
    const files = [{ filename: "src/foo.ts", status: "modified", patch: null }];
    const { filteredFiles, diff } = filterAndFormatDiff(files);
    expect(filteredFiles).toHaveLength(1);
    expect(diff).not.toContain("src/foo.ts");
  });

  it("includes patch content for modified files", () => {
    const files = [
      {
        filename: "src/foo.ts",
        status: "modified",
        patch: "@@ -1 +1 @@\n+new line",
      },
    ];
    const { diff } = filterAndFormatDiff(files);
    expect(diff).toContain("=== File: src/foo.ts ===");
    expect(diff).toContain("@@ -1 +1 @@");
    expect(diff).toContain("+new line");
  });

  it("preserves only allowed files in mixed list", () => {
    const files = [
      { filename: "src/valid.ts", status: "modified", patch: "+a" },
      { filename: "node_modules/xyz", status: "modified", patch: "+b" },
      { filename: ".next/xyz", status: "modified", patch: "+c" },
    ];
    const { filteredFiles } = filterAndFormatDiff(files);
    expect(filteredFiles).toHaveLength(1);
    expect(filteredFiles[0].filename).toBe("src/valid.ts");
  });
});
