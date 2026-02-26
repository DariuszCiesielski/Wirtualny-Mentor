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
 * - Section-level notes (inline note indicator + panel at h2 headings)
 * - "Ask mentor" button per section
 */

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import rehypeSanitize from 'rehype-sanitize';
import { Copy, Check, ExternalLink, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { SectionNoteIndicator } from '@/components/notes/section-note-indicator';
import { SectionNotesInline } from '@/components/notes/section-notes-inline';
import { SectionImage, SectionImageSkeleton } from './section-image';
import { GenerateImageButton } from './generate-image-button';
import type { Source } from '@/types/materials';
import type { Note } from '@/types/notes';
import type { LessonImage } from '@/types/images';

// Import highlight.js theme (github-dark matches our dark mode)
import 'highlight.js/styles/github-dark.css';

interface ContentRendererProps {
  content: string;
  sources?: Source[];
  className?: string;
  /** Notes grouped by section heading */
  sectionNotes?: Record<string, Note[]>;
  /** Which sections have notes panel expanded */
  expandedSections?: Set<string>;
  /** Toggle section notes visibility */
  onToggleSection?: (heading: string) => void;
  /** Add note to section */
  onAddNote?: (note: Note) => void;
  /** Update a note */
  onUpdateNote?: (note: Note) => void;
  /** Delete a note */
  onDeleteNote?: (noteId: string) => void;
  /** Ask mentor about a section */
  onAskMentor?: (sectionHeading: string) => void;
  /** Course and chapter IDs for note creation */
  courseId?: string;
  chapterId?: string;
  /** Images keyed by section heading */
  images?: Record<string, LessonImage>;
  /** Callback to generate an image for a section */
  onGenerateImage?: (sectionHeading: string) => void;
  /** Whether the user can generate images (premium feature) */
  canGenerateImages?: boolean;
  /** Sections currently being generated */
  generatingSections?: Set<string>;
  /** Section currently being auto-generated (skeleton) */
  autoGeneratingSection?: string;
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
 * Extract text from React children (for code blocks, headings, etc.)
 */
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;

  if (Array.isArray(children)) {
    return children.map(extractText).join('');
  }

  if (children && typeof children === 'object' && 'props' in children) {
    const element = children as { props: { children?: React.ReactNode } };
    return extractText(element.props.children);
  }

  return '';
}

export function ContentRenderer({
  content,
  sources = [],
  className,
  sectionNotes,
  expandedSections,
  onToggleSection,
  onAddNote,
  onUpdateNote,
  onDeleteNote,
  onAskMentor,
  courseId,
  chapterId,
  images,
  onGenerateImage,
  canGenerateImages = false,
  generatingSections,
  autoGeneratingSection,
}: ContentRendererProps) {
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

  const hasSectionFeatures = !!(sectionNotes && onToggleSection && courseId && chapterId);

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
          // Section headings with notes indicator, mentor button, and images
          h2({ children }) {
            const headingText = extractText(children);
            const sectionImage = images?.[headingText];
            const isSectionGenerating = generatingSections?.has(headingText);
            const isAutoGeneratingThis = autoGeneratingSection === headingText;
            const showGenerateButton = onGenerateImage && !sectionImage && !isSectionGenerating && !isAutoGeneratingThis;

            // Image element (shown below the heading)
            const imageElement = sectionImage?.url ? (
              <SectionImage
                url={sectionImage.url}
                altText={sectionImage.altText}
                attribution={sectionImage.sourceAttribution}
              />
            ) : isSectionGenerating || isAutoGeneratingThis ? (
              <SectionImageSkeleton
                message={isSectionGenerating ? 'Generuję grafikę...' : 'Automatyczne tworzenie grafiki...'}
              />
            ) : null;

            if (!hasSectionFeatures) {
              return (
                <>
                  <div className="not-prose flex items-center justify-between mt-10 mb-3 pb-2 border-b border-border">
                    <h2 className="text-2xl font-bold leading-tight">{children}</h2>
                    {showGenerateButton && (
                      <div className="shrink-0 ml-4">
                        <GenerateImageButton
                          sectionHeading={headingText}
                          canGenerate={canGenerateImages}
                          onGenerate={onGenerateImage}
                        />
                      </div>
                    )}
                  </div>
                  {imageElement}
                </>
              );
            }

            const notes = sectionNotes[headingText] || [];
            const isExpanded = expandedSections?.has(headingText) ?? false;

            return (
              <>
                <div className="not-prose flex items-center justify-between mt-10 mb-3 pb-2 border-b border-border">
                  <h2 className="text-2xl font-bold leading-tight">{children}</h2>
                  <div className="flex items-center gap-1 shrink-0 ml-4">
                    {showGenerateButton && (
                      <GenerateImageButton
                        sectionHeading={headingText}
                        canGenerate={canGenerateImages}
                        onGenerate={onGenerateImage}
                      />
                    )}
                    {onAskMentor && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 gap-1 text-xs text-muted-foreground"
                        onClick={() => onAskMentor(headingText)}
                        title="Zapytaj mentora o tę sekcję"
                      >
                        <MessageCircle className="h-3.5 w-3.5" />
                      </Button>
                    )}
                    <SectionNoteIndicator
                      count={notes.length}
                      isExpanded={isExpanded}
                      onClick={() => onToggleSection(headingText)}
                    />
                  </div>
                </div>
                {imageElement}
                {isExpanded && (
                  <SectionNotesInline
                    notes={notes}
                    sectionHeading={headingText}
                    courseId={courseId}
                    chapterId={chapterId}
                    onAdd={onAddNote}
                    onUpdate={onUpdateNote}
                    onDelete={onDeleteNote}
                  />
                )}
              </>
            );
          },

          h3({ children }) {
            return (
              <h3 className="mt-8 mb-2 text-xl font-semibold leading-snug text-foreground/90">
                {children}
              </h3>
            );
          },

          // Custom code block with copy button
          pre({ children, className: preClassName, ...props }) {
            const code = extractText(children);
            return (
              <div className="relative group not-prose my-6">
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

          // Custom blockquote with type detection (tip, warning, info)
          blockquote({ children }) {
            const text = extractText(children).toLowerCase();
            const isWarning = text.includes('uwaga') || text.includes('ostrzeżenie') || text.includes('⚠');
            const isTip = text.includes('wskazówka') || text.includes('💡') || text.includes('tip');

            return (
              <blockquote className={cn(
                'border-l-4 p-4 my-6 not-prose rounded-r-lg',
                isWarning && 'border-amber-500 bg-amber-50 dark:bg-amber-950/30',
                isTip && 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30',
                !isWarning && !isTip && 'border-primary bg-muted/50'
              )}>
                <div className="prose prose-zinc dark:prose-invert prose-sm max-w-none">
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
              <div className="overflow-x-auto my-6 rounded-lg border border-border">
                <table className="min-w-full divide-y divide-border">
                  {children}
                </table>
              </div>
            );
          },

          // Table header
          th({ children }) {
            return (
              <th className="px-4 py-2.5 text-left text-sm font-semibold bg-muted">
                {children}
              </th>
            );
          },

          // Table cell
          td({ children }) {
            return (
              <td className="px-4 py-2.5 text-sm border-t">
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
