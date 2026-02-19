import { encodeXML } from "entities";

import type { NormalizedTimelineItem } from "@/app/api/feed/normalize";

export function toErrorXml(message: string): string {
  const escaped = encodeXML(message);
  return `<?xml version="1.0" encoding="UTF-8"?>
<error>
  <message>${escaped}</message>
</error>`;
}

function toRfc822(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toUTCString();
}

function buildItemXml(item: NormalizedTimelineItem): string {
  const title = encodeXML(item.title || "Untitled");
  const link = encodeXML(item.url || "");
  const guid = encodeXML(item.id);
  const pubDate = toRfc822(item.updated_at);

  let description = encodeXML(item.summary || "");
  if (item.author) {
    description = `By ${encodeXML(item.author)}. ${description}`;
  }
  if (item.contributors.length > 1) {
    description += ` Contributors: ${item.contributors
      .map((c) => encodeXML(c))
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
  const escapedTitle = encodeXML(title);
  const escapedLink = encodeXML(link);
  const escapedDescription = encodeXML(description);
  const escapedFeedUrl = encodeXML(feedUrl);

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
