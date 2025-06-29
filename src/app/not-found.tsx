import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8 text-center">
      <div className="flex flex-col items-center gap-4">
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <ellipse cx="60" cy="80" rx="32" ry="18" fill="#e0f7fa" />
          <ellipse cx="45" cy="75" rx="18" ry="12" fill="#e0f7fa" />
          <ellipse cx="75" cy="75" rx="18" ry="12" fill="#e0f7fa" />
          <ellipse cx="60" cy="80" rx="10" ry="6" fill="#fff" />
          <ellipse cx="55" cy="80" rx="2.5" ry="3" fill="#1e1e1e" />
          <ellipse cx="65" cy="80" rx="2.5" ry="3" fill="#1e1e1e" />
          <path
            d="M57 84 Q60 87 63 84"
            stroke="#1e1e1e"
            strokeWidth="1.5"
            fill="none"
          />
          <ellipse cx="52" cy="83" rx="1.5" ry="0.8" fill="#ffe16a" />
          <ellipse cx="68" cy="83" rx="1.5" ry="0.8" fill="#ffe16a" />
        </svg>
        <h1 className="text-3xl font-bold">Whoopsie! 404 Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          This page doesn&apos;t exist (yet?) or maybe it just wandered off.
        </p>
      </div>
      <Link href="/">
        <Button size="lg" variant="outline" className="mt-4">
          Return Home
        </Button>
      </Link>
    </div>
  );
}
