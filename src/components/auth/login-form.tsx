import { Loader } from "lucide-react";
import { useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import Github from "@/components/ui/icons/github";

import ButtonLogin from "./login-form/button-login";

type Props = {
  onLogin: () => void;
};

export default function LoginForm({ onLogin }: Props) {
  const [isLoading, setIsLoading] = useState(false);

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
      <Separator className="w-full" />
      <CardContent>
        <div className="flex flex-col gap-6 p-6">
          <ButtonLogin
            onClick={() => {
              setIsLoading(true);
              onLogin();
            }}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              <span
                className={`absolute transition-transform duration-200 ${
                  isLoading ? "scale-0" : "scale-100"
                }`}
              >
                <Github />
              </span>
              <span
                className={`absolute transition-transform duration-200 ${
                  isLoading ? "scale-100" : "scale-0"
                }`}
              >
                <Loader className="animate-spin" />
              </span>
            </div>
            github.auth()
          </ButtonLogin>
          <p className="text-sm text-muted-foreground text-center">
            Authenticate with your GitHub account to access Nom. This will
            redirect you to GitHub&apos;s secure authentication page.
          </p>
        </div>
      </CardContent>
      <Separator className="w-full" />
      <CardFooter>
        <div className="flex flex-row justify-between w-full">
          <p className="text-muted-foreground text-xs">status: ready</p>
          <p className="text-muted-foreground text-xs">auth: github</p>
          <p className="text-muted-foreground text-xs">v1.0.0</p>
        </div>
      </CardFooter>
    </Card>
  );
}
