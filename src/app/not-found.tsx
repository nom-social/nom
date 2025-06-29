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
          <rect
            x="12"
            y="12"
            width="96"
            height="96"
            stroke="#77ebff"
            strokeWidth="8"
            fill="#1e1e1e"
            rx="2"
          />
          <ellipse cx="60" cy="80" rx="28" ry="10" fill="#ffe16a" />
          <ellipse cx="45" cy="55" rx="6" ry="8" fill="#fff" />
          <ellipse cx="75" cy="55" rx="6" ry="8" fill="#fff" />
          <circle cx="45" cy="57" r="2" fill="#1e1e1e" />
          <circle cx="75" cy="57" r="2" fill="#1e1e1e" />
          <path
            d="M50 70 Q60 78 70 70"
            stroke="#1e1e1e"
            strokeWidth="2"
            fill="none"
          />
        </svg>
        <h1 className="text-3xl font-bold">404: Not Found</h1>
        <p className="text-muted-foreground max-w-md">
          Oops! The page you&apos;re looking for doesn&apos;t exist.
          <br />
          Maybe you followed a broken link, or typed the wrong URL.
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
