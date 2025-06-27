import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";

export type Contributor = {
  name: string;
  avatar: string;
};

export default function ContributorAvatarGroup({
  contributors,
  className = "",
}: {
  contributors: Contributor[];
  className?: string;
}) {
  return (
    <div className={`flex -space-x-2 ${className}`}>
      {contributors.map((contributor, idx) => (
        <div className="relative group" key={contributor.name + idx}>
          <a
            href={`https://github.com/${contributor.name}`}
            target="_blank"
            rel="noopener noreferrer"
            tabIndex={0}
            aria-label={`Go to ${contributor.name}'s GitHub profile`}
          >
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="w-7 h-7 border-2 border-background shadow-sm hover:scale-110 transition-transform duration-200 hover:z-10 relative">
                  <AvatarImage
                    src={contributor.avatar}
                    alt={contributor.name}
                  />
                  <AvatarFallback>{contributor.name[0]}</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="top" className="px-2 py-1 text-xs">
                {contributor.name}
              </TooltipContent>
            </Tooltip>
          </a>
        </div>
      ))}
    </div>
  );
}
