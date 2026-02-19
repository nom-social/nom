import { encodeXML } from "entities";

export interface NormalizedTimelineItem {
  id: string;
  type: string;
  org: string;
  repo: string;
  title: string;
  summary: string;
  url: string;
  author: string;
  contributors: string[];
  updated_at: string;
}

function escapeXml(text: string): string {
  return encodeXML(text);
}

function toRfc822(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toUTCString();
}

function buildItemXml(item: NormalizedTimelineItem): string {
  const title = escapeXml(item.title || "Untitled");
  const link = escapeXml(item.url || "");
  const guid = escapeXml(item.id);
  const pubDate = toRfc822(item.updated_at);

  let description = escapeXml(item.summary || "");
  if (item.author) {
    description = `By ${escapeXml(item.author)}. ${description}`;
  }
  if (item.contributors.length > 1) {
    description += ` Contributors: ${item.contributors
      .map((c) => escapeXml(c))
      .join(", ")}.`;
  }

  return `    <item>
      <title>${title}</title>
      <link>${link}</link>
      <description>${description}</description>
      <pubDate>${pubDate}</pubDate>
      <guid isPermaLink="false">${guid}</guid>
    </item>`;
}

export function toRssXml(
  items: NormalizedTimelineItem[],
  options: {
    title: string;
    link: string;
    description: string;
    feedUrl: string;
    language?: string;
  }
): string {
  const { title, link, description, feedUrl, language = "en" } = options;
  const escapedTitle = escapeXml(title);
  const escapedLink = escapeXml(link);
  const escapedDescription = escapeXml(description);
  const escapedFeedUrl = escapeXml(feedUrl);

  const itemsXml = items.map(buildItemXml).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${escapedTitle}</title>
    <link>${escapedLink}</link>
    <description>${escapedDescription}</description>
    <language>${language}</language>
    <atom:link href="${escapedFeedUrl}" rel="self" type="application/rss+xml"/>
${itemsXml}
  </channel>
</rss>`;
}
