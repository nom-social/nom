import { Calendar, Github, Globe, Scale, UserPlus } from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

import ShareButton from "./repo-profile-card/share-button";
import ShareButtonMobile from "./repo-profile-card/share-button-mobile";

type Props = {
  org: string;
  repo: string;
  createdAt: Date;
  description: string;
  websiteUrl: string;
  avatarUrl: string;
  topLanguages: {
    name: string;
    color: string | null;
  }[];
  license: string;
  subscriptionCount: number;
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
  subscriptionCount,
}: Props) {
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
                Subscriber{subscriptionCount === 1 ? "" : "s"}
              </div>
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
            </div>
          </div>
        </CardTitle>
        <CardAction>
          <div className="flex flex-row gap-2">
            <Button className="hidden md:flex bg-[var(--nom-purple)] text-white hover:bg-[var(--nom-purple)]/90">
              <UserPlus />
              Subscribe
            </Button>

            <ShareButton org={org} repo={repo} />
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className="text-sm">{description}</p>
          <div className="flex flex-col items-start gap-2 md:gap-4 md:flex-row md:items-center">
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
          <Button className="flex md:hidden bg-[var(--nom-purple)] text-white hover:bg-[var(--nom-purple)]/90">
            <UserPlus />
            Subscribe
          </Button>

          <ShareButtonMobile org={org} repo={repo} />
        </div>
      </CardContent>
    </Card>
  );
}
