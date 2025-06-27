import { Globe, Share, UserPlus } from "lucide-react";

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
                <Badge>Public</Badge>
                <Badge>Typescript</Badge>
              </div>
            </div>
          </div>
        </CardTitle>
        <CardAction>
          <div className="flex flex-row gap-2">
            <Button>
              <UserPlus />
              Subscribe
            </Button>
            <Button size="icon">
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
          <div className="flex flex-row gap-2">
            <div className="flex flex-row gap-1 items-center">
              <Globe className="w-3 h-3 text-muted-foreground" />
              <a
                href="https://streamlinejs.dev"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline focus:underline outline-none text-xs"
              >
                streamlinejs.dev
              </a>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
