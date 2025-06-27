import { Calendar, Globe, Scale, Share, UserPlus } from "lucide-react";
import { format } from "date-fns";

import { Button } from "./ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

type Props = {
  org: string;
  repo: string;
};

export default function RepoProfileCard({ org, repo }: Props) {
  const createdAt = new Date("2025-06-27");

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>
          <div className="flex flex-row gap-3 items-center">
            <Avatar className="w-18 h-18">
              <AvatarImage src="https://github.com/shadcn.png" alt="shadcn" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <div className="flex flex-col gap-1">
              <p className="text-foreground text-xl sm:text-2xl">
                StreamlineJS
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
                <Badge
                  variant="outline"
                  className="border-[#2b7489] text-[#2b7489]"
                >
                  Typescript
                </Badge>
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
          <p className="text-sm">
            The fastest way to build modern web applications with zero
            configuration. Features hot reload, TypeScript support, and
            one-command deployment.
          </p>
          <div className="flex flex-row gap-4">
            <div className="flex flex-row gap-1 items-center">
              <Globe className="w-3 h-3 text-muted-foreground" />
              <a
                href="https://streamlinejs.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline focus:underline outline-none text-xs text-[var(--nom-purple)]"
              >
                streamlinejs.dev
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
              <p className="text-xs text-muted-foreground">MIT License</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
