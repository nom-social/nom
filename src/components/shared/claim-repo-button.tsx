import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { fetchRepoCount } from "./claim-repo-button/actions";

export default async function ClaimRepoButton() {
  const repoCount = await fetchRepoCount();

  if (repoCount > 0) return null;

  return (
    <Card className="border-nom-yellow/50 bg-nom-yellow/5">
      <CardHeader>
        <CardTitle>Your code activity, made readable.</CardTitle>
        <CardDescription>
          Install Nom in one click via GitHub &rarr; every push, PR, and release
          turns into a live feed you can follow, share, and reference.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <a
          href="https://github.com/apps/nom-social-club/installations/new"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button
            size="sm"
            className="bg-nom-yellow text-black hover:bg-nom-yellow/90"
          >
            Connect your repo (under 30 sec)
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
