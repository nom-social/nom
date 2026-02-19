import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

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
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src as string}
              alt={alt || "Unlabeled image"}
              style={{
                objectFit: "cover",
                width: "100%",
                height: "100%",
                position: "absolute",
                top: 0,
                left: 0,
              }}
            />
          </div>
        ),
        p: ({ children }) => <p className="break-words">{children}</p>,
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
        li: ({ children }) => <li className="mb-1">{children}</li>,
        a: ({ href, children }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary underline hover:text-nom-blue break-all"
          >
            {children}
          </a>
        ),
        h1: ({ children }) => <p className="mb-2 font-bold">{children}</p>,
        h2: ({ children }) => <p className="mb-2 font-bold">{children}</p>,
        h3: ({ children }) => <p className="mb-2 font-bold">{children}</p>,
        h4: ({ children }) => <p className="mb-2 font-bold">{children}</p>,
        h5: ({ children }) => <p className="mb-2 font-bold">{children}</p>,
        h6: ({ children }) => <p className="mb-2 font-bold">{children}</p>,
      }}
    >
      {children}
    </ReactMarkdown>
  );
};
