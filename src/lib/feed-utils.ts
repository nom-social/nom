export interface SearchFilters {
  org?: string;
  repo?: string;
  type?: string;
  from?: string;
  to?: string;
  meme?: string;
  textQuery: string;
  owner?: string;
}

/**
 * Parses the feed search query string into structured filters and remaining text.
 * Supports: org:, repo:, type:, from:, to:, owner:, meme:
 */
export function parseSearchFilters(query?: string): SearchFilters {
  if (!query || !query.trim()) {
    return { textQuery: "" };
  }

  const filters: SearchFilters = { textQuery: "" };
  let remainingText = query;

  const filterPatterns = {
    org: /\borg:(\S+)/g,
    repo: /\brepo:(\S+)/g,
    type: /\btype:(\S+)/g,
    from: /\bfrom:(\S+)/g,
    to: /\bto:(\S+)/g,
    owner: /\bowner:(\S+)/g,
    meme: /\bmeme:(\S+)/g,
  };

  Object.entries(filterPatterns).forEach(([key, pattern]) => {
    const matches = [...remainingText.matchAll(pattern)];
    if (matches.length > 0) {
      const lastMatch = matches[matches.length - 1];
      filters[key as keyof SearchFilters] = lastMatch[1];
      remainingText = remainingText.replace(pattern, "");
    }
  });

  filters.textQuery = remainingText.replace(/\s+/g, " ").trim();
  return filters;
}
