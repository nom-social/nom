import type { Metadata } from "next";
import { notFound } from "next/navigation";
import React from "react";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import StatusActivityCard from "../_components/status-activity-card";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import { BASE_URL } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import {
  prDataSchema,
  releaseDataSchema,
  pushDataSchema,
} from "@/components/shared/activity-card/shared/schemas";

import { fetchFeedItem } from "./page/actions";

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

  return (
    <main className="flex flex-col justify-center gap-4 px-2">
      <Link href={back || "/"} passHref>
        <Button
          variant="ghost"
          className="flex flex-row gap-3 items-center w-full justify-start py-2 h-fit"
        >
          <ArrowLeftIcon />
          {back === "/" ? (
            <p className="text-foreground text-lg uppercase">Feed</p>
          ) : (
            <>
              <div className="w-9 h-9 overflow-hidden shrink-0">
                <OptimizedAvatar
                  src={`https://github.com/${org}.png`}
                  alt={`${org} avatar`}
                  fallback={org[0]}
                />
              </div>
              <p className="text-foreground text-lg uppercase break-all">
                {repo}
              </p>
            </>
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

  let title = `${org}/${repo} - Nom`;
  const truncate = (str: string) =>
    str.length > 200 ? str.slice(0, 200) + "..." : str;
  let description = truncate(`View status update for ${org}/${repo} on Nom.`);

  if (statusItem.type === "pull_request") {
    const parseResult = prDataSchema.safeParse(statusItem.data);
    if (!parseResult.success) return {};
    const pr = parseResult.data.pull_request;
    title = pr.title ? `${pr.title} - ${org}/${repo}` : title;
    description = truncate(pr.ai_summary || pr.body || description);
  }
  if (statusItem.type === "release") {
    const parseResult = releaseDataSchema.safeParse(statusItem.data);
    if (!parseResult.success) return {};
    const release = parseResult.data.release;
    title = release.name ? `${release.name} - ${org}/${repo}` : title;
    description = truncate(release.ai_summary || release.body || description);
  }
  if (statusItem.type === "push") {
    const parseResult = pushDataSchema.safeParse(statusItem.data);
    if (!parseResult.success) return {};
    const push = parseResult.data.push;
    title = push.title ? `${push.title} - ${org}/${repo}` : title;
    description = truncate(push.ai_summary || description);
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
