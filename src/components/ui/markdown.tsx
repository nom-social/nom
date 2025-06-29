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
          <div className="relative aspect-video w-full overflow-hidden rounded-md border my-4">
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
        pre: ({ children }) => (
          <pre className="bg-muted rounded-md p-4 my-4 overflow-x-auto">
            {children}
          </pre>
        ),
        blockquote: ({ children }) => (
          <blockquote className="border-l-4 border-muted-foreground pl-4 ml-0 mb-4 py-2 bg-muted/50 text-muted-foreground italic">
            {children}
          </blockquote>
        ),
        ul: ({ children }) => (
          <ul className="list-disc pl-4 mb-2">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="list-decimal pl-7 mb-2">{children}</ol>
        ),
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-[var(--nom-blue)]"
          >
            {children}
          </a>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
