"use client";

import { useRouter } from "next/navigation";
import { ArrowLeftIcon } from "lucide-react";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import StatusActivityCard from "@/app/[org]/[repo]/status/[status]/page/status-activity-card";
import type { FeedItemWithLikes } from "@/app/[org]/[repo]/status/[status]/page/actions";

type StatusModalProps = {
  item: FeedItemWithLikes;
  org: string;
  repo: string;
  back?: string;
};

function BackButtonLabel({
  back,
  backPath,
  org,
  repo,
}: {
  back?: string;
  backPath: string;
  org: string;
  repo: string;
}) {
  if (!back || backPath === "/") {
    return <p className="text-foreground text-lg">Feed</p>;
  }
  if (backPath.startsWith("/following")) {
    return <p className="text-foreground text-lg">Following</p>;
  }
  if (backPath.startsWith(`/${org}/${repo}`)) {
    return (
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
    );
  }
  return <p className="text-foreground text-lg">Back</p>;
}

export function StatusModal({ item, org, repo, back }: StatusModalProps) {
  const router = useRouter();
  const backPath = back?.split("?")[0] ?? "/";

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="border-0 p-0 overflow-y-auto rounded-none top-0 left-0 translate-x-0 translate-y-0 w-full max-w-full h-full max-h-screen sm:rounded-lg sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-3xl sm:w-full sm:h-auto sm:max-h-[90vh]"
      >
        <VisuallyHidden.Root>
          <DialogTitle>{item.id}</DialogTitle>
        </VisuallyHidden.Root>
        <div className="flex flex-col gap-4 p-2 pt-4">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="flex flex-row gap-3 items-center w-full justify-start py-2 h-fit"
            >
              <ArrowLeftIcon />
              <BackButtonLabel
                back={back}
                backPath={backPath}
                org={org}
                repo={repo}
              />
            </Button>
          </DialogClose>
          <StatusActivityCard item={item} repo={repo} org={org} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
