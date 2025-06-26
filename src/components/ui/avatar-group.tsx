import { Avatar, AvatarImage, AvatarFallback } from "./avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "./tooltip";

export interface Contributor {
  name: string;
  avatar: string;
}

export function AvatarGroup({
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
          <Tooltip>
            <TooltipTrigger asChild>
              <Avatar className="w-7 h-7 border-2 border-background shadow-sm hover:scale-110 transition-transform duration-200 hover:z-10 relative">
                <AvatarImage src={contributor.avatar} alt={contributor.name} />
                <AvatarFallback>{contributor.name[0]}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top" className="px-2 py-1 text-xs">
              {contributor.name}
            </TooltipContent>
          </Tooltip>
        </div>
      ))}
    </div>
  );
}
