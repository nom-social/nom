import { minimatch } from "minimatch";

import { EXCLUDED_FILE_PATTERNS } from "./constants";

export interface DiffFile {
  filename: string;
  status: string;
  previous_filename?: string | null;
  patch?: string | null;
}

/**
 * Filters out excluded file patterns and formats files as a combined diff string.
 * Shared by PR diffs, commit diffs, and compare-refs.
 */
export function filterAndFormatDiff(files: DiffFile[]): {
  filteredFiles: DiffFile[];
  diff: string;
} {
  const filteredFiles = files.filter(
    (f) =>
      !EXCLUDED_FILE_PATTERNS.some((pattern) => minimatch(f.filename, pattern))
  );

  const diff = filteredFiles
    .map((file) => {
      const parts: string[] = [];
      parts.push(`=== File: ${file.filename} ===`);
      if (file.status === "renamed" && file.previous_filename) {
        parts.push(`Renamed from: ${file.previous_filename}`);
        parts.push("No content changes");
      } else if (!file.patch) {
        return null;
      } else {
        parts.push(file.patch);
      }
      parts.push("");
      return parts.join("\n");
    })
    .filter((d): d is string => d !== null)
    .join("\n");

  return { filteredFiles, diff };
}
