import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Image from "next/image";

interface MarkdownProps {
  children: string;
  className?: string;
}

export const Markdown: React.FC<MarkdownProps> = ({ children, className }) => {
  return (
    <div
      className={
        className ||
        "prose prose-sm dark:prose-invert prose-neutral max-w-none [&_ul]:list-disc [&_ul]:pl-4"
      }
    >
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
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
};
