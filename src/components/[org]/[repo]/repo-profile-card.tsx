import { Calendar, Globe, Scale, Share, UserPlus } from "lucide-react";
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

type Props = {
  org: string;
  repo: string;
  createdAt: Date;
  description: string;
  websiteUrl: string;
  avatarUrl: string;
  topLanguages: {
    name: string;
    color: string;
  }[];
  license: string;
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
              <p className="text-foreground text-xl sm:text-2xl uppercase">
                {repo}
              </p>
              <div className="text-muted-foreground text-sm">
                <a
                  href={`https://github.com/${org}/${repo}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline focus:underline outline-none"
                >
                  {org}/{repo}
                </a>
              </div>
              <div className="flex flex-row gap-1">
                <Badge variant="outline">Public</Badge>
                {topLanguages.map((language) => (
                  <Badge
                    key={language.name}
                    variant="outline"
                    className="border"
                    style={{
                      borderColor: language.color,
                      color: language.color,
                    }}
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
            <Button className="bg-[var(--nom-purple)] text-white hover:bg-[var(--nom-purple)]/90">
              <UserPlus />
              Subscribe
            </Button>
            <Button
              size="icon"
              className="bg-[var(--nom-blue)] hover:bg-[var(--nom-blue)]/90"
            >
              <Share />
            </Button>
          </div>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-3">
          <p className="text-sm">{description}</p>
          <div className="flex flex-row gap-4">
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
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
