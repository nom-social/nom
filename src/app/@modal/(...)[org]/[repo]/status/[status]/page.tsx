import { notFound } from "next/navigation";

import { fetchFeedItem } from "@/app/[org]/[repo]/status/[status]/page/actions";

import { StatusModal } from "./page/status-modal";

export default async function StatusModalPage({
  params,
}: {
  params: Promise<{ org: string; repo: string; status: string }>;
}) {
  const { org, repo, status: statusId } = await params;
  const statusItem = await fetchFeedItem({ org, repo, statusId });

  if (!statusItem) notFound();

  return <StatusModal item={statusItem} org={org} repo={repo} />;
}
