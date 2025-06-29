import { notFound } from "next/navigation";
import React from "react";

import { fetchFeedItem } from "./page/actions";
import FeedItem from "./page/feed-item";

export default async function StatusPage({
  params,
}: {
  params: Promise<{
    org: string;
    repo: string;
    status: string;
  }>;
}) {
  const { org, repo, status: statusId } = await params;
  const statusItem = await fetchFeedItem({ org, repo, statusId });

  if (!statusItem) notFound();

  return (
    <div className="flex flex-col justify-center gap-4 px-2">
      <FeedItem item={statusItem} repo={repo} org={org} />
    </div>
  );
}
