import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
// Optionally add these for auto-generated heading anchors:
// import rehypeSlug from 'rehype-slug';
// import rehypeAutolinkHeadings from 'rehype-autolink-headings';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

// You can also do a dynamic import if you'd like to lazy-load syntax highlighting
// for better performance, especially if your site has a lot of code blocks.

interface MarkdownRendererProps {
  content: string;
}

export function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <ReactMarkdown
      // 1) Plugins to process the raw Markdown
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[
        rehypeRaw, 
        // rehypeSlug, 
        // rehypeAutolinkHeadings, 
      ]}
      // 2) Map various Markdown nodes to custom React components
      components={{
        // --- HEADINGS ---
        h1: ({ node, ...props }) => (
          <h1 className="scroll-mt-20 text-4xl font-bold tracking-tight mt-8 mb-4" {...props} />
        ),
        h2: ({ node, ...props }) => (
          <h2 className="scroll-mt-20 text-3xl font-semibold tracking-tight mt-8 mb-4" {...props} />
        ),
        h3: ({ node, ...props }) => (
          <h3 className="scroll-mt-20 text-2xl font-semibold tracking-tight mt-6 mb-3" {...props} />
        ),
        h4: ({ node, ...props }) => (
          <h4 className="scroll-mt-20 text-xl font-semibold tracking-tight mt-6 mb-3" {...props} />
        ),
        h5: ({ node, ...props }) => (
          <h5 className="scroll-mt-20 text-lg font-semibold tracking-tight mt-6 mb-3" {...props} />
        ),
        h6: ({ node, ...props }) => (
          <h6 className="scroll-mt-20 text-base font-semibold tracking-tight mt-6 mb-3" {...props} />
        ),

        // --- CODE BLOCKS ---
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter
              style={oneDark}
              language={match[1]}
              PreTag="div"
              className="rounded-lg !bg-neutral-900 dark:!bg-neutral-800 !p-4 !my-6"
              showLineNumbers
              {...props}
            >
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code 
              className="rounded bg-neutral-100 px-1.5 py-0.5 font-mono text-sm dark:bg-neutral-800"
              {...props}
            >
              {children}
            </code>
          );
        },

        // --- LINKS ---
        a: ({ node, ...props }) => (
          <a
            {...props}
            className="text-orange-500 hover:underline dark:hover:text-orange-400"
            target="_blank"
            rel="noopener noreferrer"
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
          <blockquote
            className="border-l-4 border-orange-500/30 bg-orange-500/5
                       dark:border-orange-400/30 dark:bg-orange-400/5
                       pl-6 py-4 my-8 italic"
            {...props}
          />
        ),

        // --- PARAGRAPHS ---
        p: ({ node, ...props }) => (
          <p className="leading-relaxed my-6" {...props} />
        ),

        // --- UL & OL ---
        ul: ({ node, ...props }) => (
          <ul className="my-6 ml-6 list-disc marker:text-orange-500" {...props} />
        ),
        ol: ({ node, ...props }) => (
          <ol className="my-6 ml-6 list-decimal marker:text-orange-500" {...props} />
        ),
        li: ({ node, ...props }) => (
          <li className="mt-2" {...props} />
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
  );
}