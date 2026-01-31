'use client';

/**
 * Content Renderer Component
 *
 * Renders markdown content with:
 * - Syntax highlighting for code blocks
 * - Citation links [1] -> source URLs
 * - GFM support (tables, checkboxes, strikethrough)
 * - External link indicators
 * - Copy button for code blocks
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Copy, Check, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import type { Source } from '@/types/materials';

// Import highlight.js theme (github-dark matches our dark mode)
import 'highlight.js/styles/github-dark.css';

interface ContentRendererProps {
  content: string;
  sources?: Source[];
  className?: string;
}

/**
 * Copy button for code blocks
 */
function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-500" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </Button>
  );
}

/**
 * Extract code text from pre children
 */
function extractCode(children: React.ReactNode): string {
  if (typeof children === 'string') return children;

  if (Array.isArray(children)) {
    return children.map(extractCode).join('');
  }

  if (children && typeof children === 'object' && 'props' in children) {
    const element = children as { props: { children?: React.ReactNode } };
    return extractCode(element.props.children);
  }

  return '';
}

export function ContentRenderer({ content, sources = [], className }: ContentRendererProps) {
  // Replace citation markers [1] with markdown links to sources
  const contentWithLinks = content.replace(
    /\[(\d+)\]/g,
    (match, num) => {
      const index = parseInt(num, 10) - 1;
      const source = sources[index];
      if (source) {
        // Create inline link with title tooltip
        return `[${num}](${source.url} "${source.title}")`;
      }
      return match;
    }
  );

  return (
    <div className={cn('prose prose-zinc dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[
          rehypeRaw,
          rehypeSanitize,
          [rehypeHighlight, { detect: true, ignoreMissing: true }],
        ]}
        components={{
          // Custom code block with copy button
          pre({ children, className: preClassName, ...props }) {
            const code = extractCode(children);
            return (
              <div className="relative group not-prose">
                <pre
                  {...props}
                  className={cn(
                    'rounded-lg overflow-x-auto bg-zinc-900 p-4 text-sm',
                    preClassName
                  )}
                >
                  {children}
                </pre>
                <CopyButton code={code} />
              </div>
            );
          },

          // Inline code styling
          code({ className: codeClassName, children, ...props }) {
            // Check if it's inline code (no hljs class)
            const isInline = !codeClassName?.includes('hljs');
            if (isInline) {
              return (
                <code
                  {...props}
                  className="bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-sm font-mono"
                >
                  {children}
                </code>
              );
            }
            return (
              <code {...props} className={codeClassName}>
                {children}
              </code>
            );
          },

          // Custom blockquote for tips/warnings
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-primary bg-muted/50 p-4 my-4 not-prose rounded-r-lg">
                <div className="prose prose-zinc dark:prose-invert prose-sm">
                  {children}
                </div>
              </blockquote>
            );
          },

          // External links open in new tab with indicator
          a({ href, children, ...props }) {
            const isExternal = href?.startsWith('http');
            const isCitation = /^\d+$/.test(String(children));

            return (
              <a
                href={href}
                target={isExternal ? '_blank' : undefined}
                rel={isExternal ? 'noopener noreferrer' : undefined}
                className={cn(
                  'text-primary hover:underline',
                  isCitation && 'text-xs align-super bg-muted px-1 rounded'
                )}
                {...props}
              >
                {children}
                {isExternal && !isCitation && (
                  <ExternalLink className="inline ml-1 h-3 w-3" />
                )}
              </a>
            );
          },

          // Table styling
          table({ children }) {
            return (
              <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-border">
                  {children}
                </table>
              </div>
            );
          },

          // Table header
          th({ children }) {
            return (
              <th className="px-4 py-2 text-left text-sm font-semibold bg-muted">
                {children}
              </th>
            );
          },

          // Table cell
          td({ children }) {
            return (
              <td className="px-4 py-2 text-sm border-t">
                {children}
              </td>
            );
          },
        }}
      >
        {contentWithLinks}
      </ReactMarkdown>
    </div>
  );
}
