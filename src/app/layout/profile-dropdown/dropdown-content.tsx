"use client";

import { useRouter } from "next/navigation";

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
    <DropdownMenuContent>
      <DropdownMenuLabel>{user.github_username}</DropdownMenuLabel>
      <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
      <DropdownMenuSeparator />
      <DropdownMenuItem onClick={handleLogout}>Logout</DropdownMenuItem>
    </DropdownMenuContent>
  );
}
