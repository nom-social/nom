import { notFound } from "next/navigation";

import {
  prDataSchema,
  releaseDataSchema,
  pushDataSchema,
} from "@/components/shared/activity-card/shared/schemas";
import { fetchFeedItem } from "@/app/[org]/[repo]/status/[status]/page/actions";

import { StatusModal } from "./status-modal";

export default async function StatusModalPage({
  params,
}: {
  params: Promise<{ org: string; repo: string; status: string }>;
}) {
  const { org, repo, status: statusId } = await params;
  const statusItem = await fetchFeedItem({ org, repo, statusId });

  if (!statusItem) notFound();

  let title = `${org}/${repo}`;
  if (statusItem.type === "pull_request") {
    const parsed = prDataSchema.safeParse(statusItem.data);
    if (parsed.success) title = parsed.data.pull_request.title;
  } else if (statusItem.type === "release") {
    const parsed = releaseDataSchema.safeParse(statusItem.data);
    if (parsed.success)
      title = parsed.data.release.name ?? parsed.data.release.tag_name;
  } else if (statusItem.type === "push") {
    const parsed = pushDataSchema.safeParse(statusItem.data);
    if (parsed.success) title = parsed.data.push.title;
  }

  return <StatusModal item={statusItem} org={org} repo={repo} title={title} />;
}
