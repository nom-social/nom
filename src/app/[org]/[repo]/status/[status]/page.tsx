import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  prDataSchema,
  releaseDataSchema,
  pushDataSchema,
} from "@/components/shared/activity-card/shared/schemas";

import { fetchFeedItem } from "./page/actions";
import StatusActivityCard from "./page/status-activity-card";

function getStatusItemTitle(item: {
  type: string;
  data: unknown;
}): string | null {
  if (item.type === "pull_request") {
    const parsed = prDataSchema.safeParse(item.data);
    if (parsed.success) return parsed.data.pull_request.title;
    return null;
  }
  if (item.type === "release") {
    const parsed = releaseDataSchema.safeParse(item.data);
    if (parsed.success)
      return parsed.data.release.name ?? parsed.data.release.tag_name;
    return null;
  }
  if (item.type === "push") {
    const parsed = pushDataSchema.safeParse(item.data);
    if (parsed.success) return parsed.data.push.title;
    return null;
  }
  return null;
}

export default async function StatusPage({
  params,
  searchParams,
}: {
  params: Promise<{
    org: string;
    repo: string;
    status: string;
  }>;
  searchParams: Promise<{ back?: string }>;
}) {
  const { org, repo, status: statusId } = await params;
  const { back } = await searchParams;
  const statusItem = await fetchFeedItem({ org, repo, statusId });

  if (!statusItem) notFound();

  const backPath = back?.split("?")[0] ?? "/";

  return (
    <main className="flex flex-col justify-center gap-4 px-2">
      <Link href={back || "/"} passHref>
        <Button
          variant="ghost"
          className="flex flex-row gap-3 items-center w-full justify-start py-2 h-fit"
        >
          <ArrowLeftIcon />
          {!back || backPath === "/" ? (
            <p className="text-foreground text-lg">Feed</p>
          ) : backPath.startsWith("/following") ? (
            <p className="text-foreground text-lg">Following</p>
          ) : backPath.startsWith(`/${org}/${repo}`) ? (
            <>
              <div className="w-9 h-9">
                <OptimizedAvatar
                  src={`https://github.com/${org}.png`}
                  alt={`${org} avatar`}
                  fallback={org[0]}
                  sizes="36px"
                />
              </div>
              <p className="text-foreground text-lg break-all">{repo}</p>
            </>
          ) : (
            <p className="text-foreground text-lg">Back</p>
          )}
        </Button>
      </Link>
      <StatusActivityCard item={statusItem} repo={repo} org={org} />
    </main>
  );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ org: string; repo: string; status: string }>;
}): Promise<Metadata> {
  const { org, repo, status } = await params;
  const statusItem = await fetchFeedItem({
    org,
    repo,
    statusId: status,
  });

  if (!statusItem) return {};

  const itemTitle = getStatusItemTitle(statusItem);
  const title = itemTitle
    ? `${itemTitle} - ${org}/${repo}`
    : `${org}/${repo} - Nom`;
  const truncate = (str: string) =>
    str.length > 200 ? str.slice(0, 200) + "..." : str;
  let description = truncate(`View status update for ${org}/${repo} on Nom.`);

  if (statusItem.type === "pull_request") {
    const parseResult = prDataSchema.safeParse(statusItem.data);
    if (!parseResult.success) return {};
    description = truncate(
      parseResult.data.pull_request.ai_summary ||
        parseResult.data.pull_request.body ||
        description,
    );
  } else if (statusItem.type === "release") {
    const parseResult = releaseDataSchema.safeParse(statusItem.data);
    if (!parseResult.success) return {};
    description = truncate(
      parseResult.data.release.ai_summary ||
        parseResult.data.release.body ||
        description,
    );
  } else if (statusItem.type === "push") {
    const parseResult = pushDataSchema.safeParse(statusItem.data);
    if (!parseResult.success) return {};
    description = truncate(parseResult.data.push.ai_summary || description);
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `${BASE_URL}/${org}/${repo}/status/${status}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
