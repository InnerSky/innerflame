import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
// Optionally add these for auto-generated heading anchors:
// import rehypeSlug from 'rehype-slug';
// import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { cn } from '@/lib/utils';

// You can also do a dynamic import if you'd like to lazy-load syntax highlighting
// for better performance, especially if your site has a lot of code blocks.

type MarkdownProps = {
  content: string;
  className?: string;
};

export function MarkdownRenderer({ content, className }: MarkdownProps) {
  return (
    <div className={cn("prose prose-stone dark:prose-invert max-w-none", className)}>
      <ReactMarkdown
        // 1) Plugins to process the raw Markdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        // 2) Map various Markdown nodes to custom React components
        components={{
          // --- HEADINGS ---
          h1: ({ node, ...props }) => (
            <h1 className="mb-4 text-3xl font-bold tracking-tight" {...props} />
          ),
          h2: ({ node, ...props }) => (
            <h2 className="mb-3 text-2xl font-bold tracking-tight" {...props} />
          ),
          h3: ({ node, ...props }) => (
            <h3 className="mb-3 text-xl font-bold tracking-tight" {...props} />
          ),
          h4: ({ node, ...props }) => (
            <h4 className="mb-3 text-lg font-bold tracking-tight" {...props} />
          ),
          h5: ({ node, ...props }) => (
            <h5 className="scroll-mt-20 text-lg font-semibold tracking-tight mt-6 mb-3" {...props} />
          ),
          h6: ({ node, ...props }) => (
            <h6 className="scroll-mt-20 text-base font-semibold tracking-tight mt-6 mb-3" {...props} />
          ),

          // --- CODE BLOCKS ---
          code: ({ node, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return match ? (
              <pre className="rounded-md bg-muted p-4 overflow-x-auto">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className={cn("rounded bg-muted px-1.5 py-0.5 font-mono text-sm", className)} {...props}>
                {children}
              </code>
            );
          },

          // --- LINKS ---
          a: ({ node, ...props }) => (
            <a 
              className="font-medium text-primary underline underline-offset-4" 
              target="_blank"
              rel="noopener noreferrer"
              {...props} 
            />
          ),

          // --- IMAGES ---
          img: ({ node, ...props }) => (
            // Add `alt` if missing, `loading="lazy"` for performance, etc.
            <img 
              {...props}
              alt={(props.alt as string) ?? 'Image'} 
              loading="lazy"
              className="rounded-lg shadow-lg my-8"
            />
          ),

          // --- BLOCKQUOTE ---
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-primary/20 pl-4 italic" {...props} />
          ),

          // --- PARAGRAPHS ---
          p: ({ node, ...props }) => (
            <p className="mb-4 leading-7" {...props} />
          ),

          // --- UL & OL ---
          ul: ({ node, ...props }) => (
            <ul className="mb-4 list-disc pl-6" {...props} />
          ),
          ol: ({ node, ...props }) => (
            <ol className="mb-4 list-decimal pl-6" {...props} />
          ),
          li: ({ node, ...props }) => (
            <li className="mb-2" {...props} />
          ),

          // --- TABLES ---
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-x-auto">
              <table className="w-full border-collapse text-left" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th
              className="border border-neutral-200 bg-neutral-100 px-4 py-2 text-sm font-semibold 
                         dark:border-neutral-800 dark:bg-neutral-900"
              {...props}
            />
          ),
          td: ({ node, ...props }) => (
            <td
              className="border border-neutral-200 px-4 py-2 text-sm 
                         dark:border-neutral-800"
              {...props}
            />
          ),
        }}
      >
        {content || 'No content available'}
      </ReactMarkdown>
    </div>
  );
}