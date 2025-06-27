import { Github } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function LoginForm() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-destructive border border-destructive" />
              <div className="w-3 h-3 bg-[var(--nom-yellow)] border border-[var(--nom-yellow)]" />
              <div className="w-3 h-3 bg-[var(--nom-green)] border border-[var(--nom-green)]" />
            </div>
            <span>{"> user.authenticate()"}</span>
          </div>
        </CardTitle>
        <CardDescription>
          Connect your GitHub account to continue
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Button className="w-full" variant="outline">
          {/* TODO: Use a different github icon */}
          <Github /> github.auth()
        </Button>
      </CardContent>
    </Card>
  );
}
