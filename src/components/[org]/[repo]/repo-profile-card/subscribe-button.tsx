"use client";

import { UserPlus, UserCheck, Loader } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  isSubscribed: boolean;
  className?: string;
  onSubscribe: () => void;
  onUnsubscribe: () => void;
  isLoading: boolean;
};

export default function SubscribeButton({
  isSubscribed,
  className,
  onSubscribe,
  onUnsubscribe,
  isLoading,
}: Props) {
  return (
    <Button
      className={cn(
        isLoading
          ? ""
          : isSubscribed
          ? "bg-nom-green text-black hover:bg-nom-green/90"
          : "bg-nom-purple text-white hover:bg-nom-purple/90",
        className
      )}
      onClick={isSubscribed ? onUnsubscribe : onSubscribe}
      disabled={isLoading}
    >
      {isLoading ? (
        <Loader className="animate-spin" />
      ) : isSubscribed ? (
        <UserCheck />
      ) : (
        <UserPlus />
      )}
      Subscribe{isSubscribed ? "d" : ""}
    </Button>
  );
}
