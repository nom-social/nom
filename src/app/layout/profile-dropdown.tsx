import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { getCurrentUser } from "./profile-dropdown/actions";
import DropdownContent from "./profile-dropdown/dropdown-content";

export default async function ProfileDropdown() {
  const user = await getCurrentUser();

  if (!user) return null;

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="cursor-pointer">
        <Avatar className="w-8 h-8">
          <AvatarImage src={`https://github.com/${user.github_username}.png`} />
          <AvatarFallback>{user.github_username.charAt(0)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>

      <DropdownContent user={user} />
    </DropdownMenu>
  );
}
