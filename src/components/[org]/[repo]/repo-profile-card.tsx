"use client";

import { useState } from "react";
import { Calendar, Github, Globe, Scale } from "lucide-react";
import { format } from "date-fns";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

import {
  createSubscription,
  isSubscribed,
  NotAuthenticatedError,
  removeSubscription,
} from "./repo-profile-card/actions";
import ShareButton from "./repo-profile-card/share-button";
import ShareButtonMobile from "./repo-profile-card/share-button-mobile";
import SubscribeButton from "./repo-profile-card/subscribe-button";

type Props = {
  org: string;
  repo: string;
  createdAt: Date;
  description: string | null;
  websiteUrl: string | null;
  avatarUrl: string;
  topLanguages: {
    name: string;
    color: string | null;
  }[];
  license: string | null;
  initialSubscriptionCount: number;
};

export default function RepoProfileCard({
  org,
  repo,
  createdAt,
  description,
  websiteUrl,
  avatarUrl,
  topLanguages,
  license,
  initialSubscriptionCount,
}: Props) {
  const router = useRouter();

  const [subscriptionCount, setSubscriptionCount] = useState(
    initialSubscriptionCount
  );

  const {
    data: subscribedData,
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: [isSubscribed.key, org, repo],
    queryFn: () => isSubscribed(org, repo),
    refetchOnWindowFocus: false,
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: ({ org, repo }: { org: string; repo: string }) =>
      createSubscription(org, repo),
    onSuccess: async () => {
      setSubscriptionCount((prev) => prev + 1);
      await refetch();
      toast.success(
        `🔥 YOOO! Welcome to ${repo}! You just joined ${Intl.NumberFormat(
          "en",
          { notation: "compact" }
        ).format(initialSubscriptionCount)} dev${
          initialSubscriptionCount === 1 ? "" : "s"
        } building the future! LFG! 🚀`,
        { icon: null }
      );
    },
    onError: (error) => {
      if (error instanceof NotAuthenticatedError)
        router.push(
          `/auth/login?next=${encodeURIComponent(window.location.pathname)}`
        );
    },
  });

  const removeSubscriptionMutation = useMutation({
    mutationFn: ({ org, repo }: { org: string; repo: string }) =>
      removeSubscription(org, repo),
    onSuccess: async () => {
      setSubscriptionCount((prev) => prev - 1);
      await refetch();
      toast(
        `💔 NOOO! We're literally crying! You're breaking our heart but we respect your choice. ` +
          "We'll miss you! 😭"
      );
    },
    onError: (error) => {
      if (error instanceof NotAuthenticatedError)
        router.push(
          `/auth/login?next=${encodeURIComponent(window.location.pathname)}`
        );
    },
  });

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row gap-3 items-center">
            <Avatar className="w-18 h-18">
              <AvatarImage src={avatarUrl} alt={`${org} avatar`} />
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="text-foreground text-xl uppercase break-all">
                {repo}
              </p>
              <div className="text-muted-foreground text-sm w-full">
                {Intl.NumberFormat("en", { notation: "compact" }).format(
                  subscriptionCount
                )}{" "}
                subscriber{subscriptionCount === 1 ? "" : "s"}
              </div>
            </div>
          </div>
        </CardTitle>
        <CardAction>
          <div className="flex flex-row gap-2">
            <SubscribeButton
              isSubscribed={subscribedData?.subscribed ?? false}
              className="hidden md:flex"
              onSubscribe={() =>
                createSubscriptionMutation.mutate({ org, repo })
              }
              onUnsubscribe={() =>
                removeSubscriptionMutation.mutate({ org, repo })
              }
              isLoading={
                createSubscriptionMutation.isPending ||
                removeSubscriptionMutation.isPending ||
                isLoading ||
                isRefetching
              }
            />

            <ShareButton org={org} repo={repo} />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex flex-row flex-wrap gap-1 sm:gap-2 items-center">
            <Badge variant="outline">Public</Badge>
            {topLanguages.map((language) => (
              <Badge
                key={language.name}
                variant="outline"
                className="border"
                style={
                  language.color
                    ? {
                        borderColor: language.color,
                        color: language.color,
                      }
                    : {}
                }
              >
                {language.name}
              </Badge>
            ))}
          </div>

          <p className="text-sm">{description}</p>
          <div className="flex flex-col items-start gap-2 md:gap-4 md:flex-row md:items-center">
            {websiteUrl && (
              <div className="flex flex-row gap-1 items-center">
                <Globe className="w-3 h-3 text-muted-foreground" />
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline focus:underline outline-none text-xs text-[var(--nom-purple)]"
                >
                  {new URL(websiteUrl).hostname.replace(/^www\./, "")}
                </a>
              </div>
            )}
            <div className="flex flex-row gap-1 items-center">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">
                Created {format(createdAt, "MMM yyyy")}
              </p>
            </div>

            <div className="flex flex-row gap-1 items-center">
              <Scale className="w-3 h-3 text-muted-foreground" />
              <p className="text-xs text-muted-foreground">{license} license</p>
            </div>

            <div className="flex flex-row gap-1 items-center">
              <Github className="w-3 h-3 text-muted-foreground" />
              <a
                href={`https://github.com/${org}/${repo}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline focus:underline outline-none text-xs text-muted-foreground"
              >
                {org}/{repo}
              </a>
            </div>
          </div>

          <SubscribeButton
            isSubscribed={subscribedData?.subscribed ?? false}
            className="flex md:hidden"
            onSubscribe={() => createSubscriptionMutation.mutate({ org, repo })}
            onUnsubscribe={() =>
              removeSubscriptionMutation.mutate({ org, repo })
            }
            isLoading={
              createSubscriptionMutation.isPending ||
              removeSubscriptionMutation.isPending ||
              isLoading ||
              isRefetching
            }
          />

          <ShareButtonMobile org={org} repo={repo} />
        </div>
      </CardContent>
    </Card>
  );
}
