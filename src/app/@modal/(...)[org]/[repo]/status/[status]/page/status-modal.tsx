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
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import StatusActivityCard from "@/app/[org]/[repo]/status/[status]/page/status-activity-card";
import type { FeedItemWithLikes } from "@/app/[org]/[repo]/status/[status]/page/actions";

type StatusModalProps = {
  item: FeedItemWithLikes;
  org: string;
  repo: string;
};

export function StatusModal({ item, org, repo }: StatusModalProps) {
  const router = useRouter();

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
        <div className="flex flex-col gap-4 px-2 pt-2">
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="flex flex-row gap-3 items-center w-full justify-start py-2 h-fit"
            >
              <ArrowLeftIcon />
              <p className="text-foreground text-lg">Feed</p>
            </Button>
          </DialogClose>
          <StatusActivityCard item={item} repo={repo} org={org} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
