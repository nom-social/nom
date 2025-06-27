import * as React from "react";

import { cn } from "@/lib/utils";

// Style similar to outline variant from button.tsx
const loginButtonClass = cn(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive cursor-pointer",
  "border shadow-xs hover:bg-[var(--nom-green)] hover:text-black w-full py-4 bg-muted"
);

export default function ButtonLogin({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      data-slot="button-login"
      className={cn(loginButtonClass, className)}
      {...props}
    />
  );
}
