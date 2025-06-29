import { notFound } from "next/navigation";
import React from "react";
import { ArrowLeftIcon } from "lucide-react";
import Link from "next/link";

import ActivityCard from "@/components/shared/activity-card";
import { Avatar, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

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
