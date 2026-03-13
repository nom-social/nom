"use client";

import { useState } from "react";
import { Calendar, Github, Globe, Scale } from "lucide-react";
import { format } from "date-fns";
import { useQuery } from "convex/react";
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
import { OptimizedAvatar } from "@/components/ui/optimized-avatar";

import { api } from "@/../convex/_generated/api";
import {
  createSubscription,
  removeSubscription,
} from "./repo-profile-card/actions";
import { NotAuthenticatedError } from "@/lib/errors";
import ShareButton from "./repo-profile-card/share-button";
import ShareButtonMobile from "./repo-profile-card/share-button-mobile";
import SubscribeButton from "./repo-profile-card/subscribe-button";
import { LANGUAGE_COLORS } from "./repo-profile-card/constants";

type Props = {
  org: string;
  repo: string;
  createdAt: Date;
  description: string | null;
  websiteUrl: string | null;
  avatarUrl: string;
  topLanguages: { name: string }[];
  license: string | null;
  initialSubscriptionCount: number;
  isPrivate?: boolean;
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
  isPrivate = false,
}: Props) {
  const router = useRouter();

  const [subscriptionCount, setSubscriptionCount] = useState(
    initialSubscriptionCount,
  );
  const [isPending, setIsPending] = useState(false);

  const subscribedData = useQuery(api.subscriptions.isSubscribed, {
    org,
    repo,
  });

  const isLoading = subscribedData === undefined;

  async function handleSubscribe() {
    setIsPending(true);
    try {
      await createSubscription(org, repo);
      setSubscriptionCount((prev) => prev + 1);
      toast.success(
        `🔥 YOOO! Welcome to ${repo}! You just joined ${Intl.NumberFormat(
          "en",
          { notation: "compact" },
        ).format(initialSubscriptionCount)} dev${
          initialSubscriptionCount === 1 ? "" : "s"
        } building the future! LFG! 🚀`,
        { icon: null },
      );
    } catch (error) {
      if (error instanceof NotAuthenticatedError)
        router.push(
          `/auth/login?next=${encodeURIComponent(window.location.pathname)}`,
        );
    } finally {
      setIsPending(false);
    }
  }

  async function handleUnsubscribe() {
    setIsPending(true);
    try {
      await removeSubscription(org, repo);
      setSubscriptionCount((prev) => prev - 1);
      toast(
        `💔 NOOO! We're literally crying! You're breaking our heart but we respect your choice. ` +
          "We'll miss you! 😭",
      );
    } catch (error) {
      if (error instanceof NotAuthenticatedError)
        router.push(
          `/auth/login?next=${encodeURIComponent(window.location.pathname)}`,
        );
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row gap-3 items-center">
            <div className="w-18 h-18">
              <OptimizedAvatar
                src={avatarUrl}
                alt={`${org} avatar`}
                fallback={org[0]}
                sizes="72px"
              />
            </div>
            <div className="flex flex-col gap-1">
              <p className="text-foreground text-xl break-all">{repo}</p>
              <div className="text-muted-foreground text-sm w-full">
                {Intl.NumberFormat("en", { notation: "compact" }).format(
                  subscriptionCount,
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
              onSubscribe={handleSubscribe}
              onUnsubscribe={handleUnsubscribe}
              isLoading={isPending || isLoading}
            />

            <ShareButton org={org} repo={repo} />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <div className="flex flex-row flex-wrap gap-1 sm:gap-2 items-center">
            {topLanguages.map((language) => (
              <Badge
                key={language.name}
                variant="outline"
                className="border"
                style={{ borderColor: LANGUAGE_COLORS[language.name] }}
              >
                {language.name}
              </Badge>
            ))}
          </div>

          {description && <p className="text-sm">{description}</p>}
          <div className="flex flex-col items-start gap-2 md:gap-4 md:flex-row md:items-center">
            {websiteUrl && (
              <div className="flex flex-row gap-1 items-center">
                <Globe className="w-3 h-3 text-muted-foreground" />
                <a
                  href={websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline focus:underline outline-none text-xs text-nom-purple"
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

            {license && (
              <div className="flex flex-row gap-1 items-center">
                <Scale className="w-3 h-3 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">
                  {license} license
                </p>
              </div>
            )}

            {!isPrivate && (
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
            )}
          </div>

          <SubscribeButton
            isSubscribed={subscribedData?.subscribed ?? false}
            className="flex md:hidden"
            onSubscribe={handleSubscribe}
            onUnsubscribe={handleUnsubscribe}
            isLoading={isPending || isLoading}
          />

          <ShareButtonMobile org={org} repo={repo} />
        </div>
      </CardContent>
    </Card>
  );
}
