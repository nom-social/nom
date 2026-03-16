"use client";

import { useRouter } from "next/navigation";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";

import StatusActivityCard from "@/app/[org]/[repo]/status/[status]/page/status-activity-card";
import type { FeedItemWithLikes } from "@/app/[org]/[repo]/status/[status]/page/actions";

type StatusModalProps = {
  item: FeedItemWithLikes;
  org: string;
  repo: string;
  title: string;
};

export function StatusModal({ item, org, repo, title }: StatusModalProps) {
  const router = useRouter();

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) router.back();
      }}
    >
      <DialogContent className="border-0 p-0 overflow-y-auto rounded-none top-0 left-0 translate-x-0 translate-y-0 w-full max-w-full h-full max-h-screen sm:rounded-lg sm:top-[50%] sm:left-[50%] sm:translate-x-[-50%] sm:translate-y-[-50%] sm:max-w-3xl sm:w-full sm:h-auto sm:max-h-[90vh]">
        <VisuallyHidden.Root>
          <DialogTitle>{title}</DialogTitle>
        </VisuallyHidden.Root>
        <StatusActivityCard item={item} repo={repo} org={org} />
      </DialogContent>
    </Dialog>
  );
}
