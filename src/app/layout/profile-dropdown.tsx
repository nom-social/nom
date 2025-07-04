import Link from "next/link";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

import { getCurrentUser } from "./profile-dropdown/actions";
import DropdownContent from "./profile-dropdown/dropdown-content";

export default async function ProfileDropdown() {
  const user = await getCurrentUser();

  if (!user)
    return (
      <Link href="/auth/login">
        <Button className="bg-nom-green text-black hover:bg-nom-green/90">
          Login
        </Button>
      </Link>
    );

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger>
        <Avatar className="w-8 h-8">
          <AvatarImage src={`https://github.com/${user.github_username}.png`} />
          <AvatarFallback>{user.github_username.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownContent user={user} />
    </DropdownMenu>
  );
}
