"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";

import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type User = {
  githubUsername?: string;
  email?: string;
};

type Props = {
  user: User;
};

export default function DropdownContent({ user }: Props) {
  const { signOut } = useAuthActions();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut();
    router.refresh();
  };

  return (
    <DropdownMenuContent align="end" className="min-w-[200px]">
      <DropdownMenuLabel>
        <div className="flex flex-col">
          <span className="text-sm font-medium break-all whitespace-normal">
            {user.githubUsername}
          </span>
          <span className="text-xs text-muted-foreground break-all whitespace-normal">
            {user.email}
          </span>
        </div>
      </DropdownMenuLabel>
      <DropdownMenuSeparator />

      <Link href="/">
        <DropdownMenuItem>Home</DropdownMenuItem>
      </Link>

      <a
        href="https://github.com/apps/nom-social-club/installations/new"
        target="_blank"
        rel="noopener noreferrer"
      >
        <DropdownMenuItem>Connect more repos 🎉</DropdownMenuItem>
      </a>

      <DropdownMenuItem variant="destructive" onClick={handleLogout}>
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
