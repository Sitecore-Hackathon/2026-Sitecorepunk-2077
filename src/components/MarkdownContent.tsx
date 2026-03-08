"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownContentProps {
  content: string;
  className?: string;
}

const UNSAFE_URL_PREFIXES = [
  "javascript:",
  "data:",
  "vbscript:",
  "file:",
] as const;

function isSafeHref(href: string | undefined): boolean {
  if (!href || typeof href !== "string") return false;
  const lower = href.trim().toLowerCase();
  return !UNSAFE_URL_PREFIXES.some((prefix) => lower.startsWith(prefix));
}

const baseClassName =
  "leading-relaxed [&_a]:text-primary [&_a]:underline [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-3 [&_blockquote]:italic [&_code]:rounded [&_code]:bg-background/70 [&_code]:px-1 [&_code]:py-0.5 [&_ol]:list-decimal [&_ol]:pl-4 [&_p]:my-0 [&_p:not(:first-child)]:mt-2 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-background/70 [&_pre]:p-3 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_ul]:list-disc [&_ul]:pl-4";

export function MarkdownContent({
  content,
  className,
}: MarkdownContentProps) {
  return (
    <div className={className ? `${baseClassName} ${className}` : baseClassName}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ href, ...props }) => (
            <a
              {...props}
              href={isSafeHref(href) ? href : "#"}
              target="_blank"
              rel="noreferrer noopener"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
