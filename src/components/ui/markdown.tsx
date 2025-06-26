import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

interface MarkdownProps {
  children: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ children }) => {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        img: ({ src, alt }) => (
          <div className="relative aspect-video w-full overflow-hidden rounded-lg border my-4">
            <Image
              src={src as string}
              alt={alt || "Unlabeled image"}
              fill
              className="object-cover"
            />
          </div>
        ),
        p: ({ children }) => <p>{children}</p>,
        code: ({ children }) => (
          <code className="bg-muted px-1.5 py-0.5 font-mono text-sm text-muted-foreground">
            {children}
          </code>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
