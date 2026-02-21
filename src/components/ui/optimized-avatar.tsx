"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const GITHUB_IMAGE_HOSTS = [
  "github.com",
  "avatars.githubusercontent.com",
  "raw.githubusercontent.com",
];

function isGitHubImageUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return GITHUB_IMAGE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  } catch {
    return false;
  }
}

type OptimizedAvatarProps = {
  src: string;
  alt: string;
  fallback?: React.ReactNode;
  className?: string;
  sizes?: string;
};

export function OptimizedAvatar({
  src,
  alt,
  fallback,
  className,
  sizes = "64px",
}: OptimizedAvatarProps) {
  const [showFallback, setShowFallback] = useState(false);

  const wrapperClasses = "relative size-full shrink-0 overflow-hidden";

  if (showFallback) {
    return (
      <div
        className={cn(
          wrapperClasses,
          "flex items-center justify-center bg-muted",
          className
        )}
      >
        {fallback}
      </div>
    );
  }

  const imageClasses = "aspect-square size-full object-cover";

  return (
    <span className={cn(wrapperClasses, "block", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized={!isGitHubImageUrl(src)}
        className={imageClasses}
        onError={() => setShowFallback(true)}
        sizes={sizes}
      />
    </span>
  );
}
