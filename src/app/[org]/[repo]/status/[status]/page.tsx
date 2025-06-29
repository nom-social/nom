import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import ActivityCard from "@/components/shared/activity-card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import type {
  PrData,
  IssueData,
  ReleaseData,
} from "@/components/shared/activity-cards/shared/schemas";

import { fetchFeedItem } from "./page/actions";

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
      <Link href={`/${org}/${repo}`} passHref>
        <Button
          variant="ghost"
          className="flex flex-row gap-3 items-center w-full justify-start py-2 h-fit"
        >
          <ArrowLeftIcon />
          <Avatar className="w-9 h-9">
            <AvatarImage
              src={`https://github.com/${org}.png`}
              alt={`${org} avatar`}
            />
          </Avatar>
          <p className="text-foreground text-lg uppercase break-all">{repo}</p>
        </Button>
      </Link>
      <ActivityCard item={statusItem} repo={repo} org={org} />
    </div>
  );
}

export async function generateMetadata({
  params,
}: {
  params: { org: string; repo: string; status: string };
}): Promise<Metadata> {
  const { org, repo, status } = params;
  const statusItem = await fetchFeedItem({
    org,
    repo,
    statusId: status,
  });

  if (!statusItem) return {};

  let title = `${org}/${repo} - Nom`;
  const truncate = (str: string) =>
    str.length > 200 ? str.slice(0, 200) + "..." : str;
  let description = truncate(`View status update for ${org}/${repo} on Nom.`);

  if (
    statusItem.type === "pull_request" &&
    statusItem.data &&
    typeof statusItem.data === "object"
  ) {
    const pr = (statusItem.data as PrData)["pull_request"];
    if (pr) {
      title = pr.title ? `${pr.title} - ${org}/${repo}` : title;
      description = truncate(pr.ai_summary || pr.body || description);
    }
  } else if (
    statusItem.type === "issue" &&
    statusItem.data &&
    typeof statusItem.data === "object"
  ) {
    const issue = (statusItem.data as IssueData)["issue"];
    if (issue) {
      title = issue.title ? `${issue.title} - ${org}/${repo}` : title;
      description = truncate(issue.ai_summary || issue.body || description);
    }
  } else if (
    statusItem.type === "release" &&
    statusItem.data &&
    typeof statusItem.data === "object"
  ) {
    const release = (statusItem.data as ReleaseData)["release"];
    if (release) {
      title = release.name ? `${release.name} - ${org}/${repo}` : title;
      description = truncate(release.ai_summary || release.body || description);
    }
  }

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://nom.social/${org}/${repo}/status/${status}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}
