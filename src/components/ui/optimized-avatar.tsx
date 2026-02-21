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
};

export function OptimizedAvatar({
  src,
  alt,
  fallback,
  className,
}: OptimizedAvatarProps) {
  const [useFallback, setUseFallback] = useState(false);
  const [imgError, setImgError] = useState(false);

  const wrapperClasses = "relative size-full shrink-0 overflow-hidden";

  if (useFallback || imgError) {
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

  if (isGitHubImageUrl(src)) {
    return (
      <span className={cn(wrapperClasses, "block", className)}>
        <Image
          src={src}
          alt={alt}
          fill
          className={imageClasses}
          onError={() => setImgError(true)}
          sizes="(max-width: 768px) 32px, 72px"
        />
      </span>
    );
  }

  // Non-GitHub URLs: use Image with unoptimized (avoids no-img-element lint)
  return (
    <span className={cn(wrapperClasses, "block", className)}>
      <Image
        src={src}
        alt={alt}
        fill
        unoptimized
        className={imageClasses}
        onError={() => setUseFallback(true)}
      />
    </span>
  );
}
