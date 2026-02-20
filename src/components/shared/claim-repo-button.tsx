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
        <CardTitle>Connect your first repo</CardTitle>
        <CardDescription>
          You&apos;ll install the Nom GitHub App on GitHub (a one-time setup).
          Choose which repositories to connect (you can add more anytime). Once
          connected, your project&apos;s activities (issues, PRs, releases, and
          comments) from then on will show up in your feed, and you can
          subscribe to any other repo on Nom.
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
            Connect your repo →
          </Button>
        </a>
      </CardFooter>
    </Card>
  );
}
