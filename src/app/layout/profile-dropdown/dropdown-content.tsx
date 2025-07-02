"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Tables } from "@/types/supabase";
import { createClient } from "@/utils/supabase/client";

type Props = {
  user: Tables<"users">;
};

export default function DropdownContent({ user }: Props) {
  const supabase = createClient();
  const router = useRouter();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.refresh();
  };

  return (
    <DropdownMenuContent align="end" className="min-w-[200px]">
      <DropdownMenuLabel>
        <div className="flex flex-col">
          <span className="text-sm font-medium break-all whitespace-normal">
            {user.github_username}
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
      >
        <DropdownMenuItem>Connect more repos 🎉</DropdownMenuItem>
      </a>

      <DropdownMenuItem variant="destructive" onClick={handleLogout}>
        Logout
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
