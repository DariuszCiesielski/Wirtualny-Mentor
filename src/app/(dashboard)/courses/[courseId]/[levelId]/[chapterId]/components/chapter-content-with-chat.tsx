'use client';

/**
 * ChapterContent with Chat Context
 *
 * Thin wrapper that connects ChapterContent with ChatContext.
 * Consumes the askMentor callback from ChatContext and passes it to ChapterContent.
 */

import { ChapterContent } from '@/components/materials/chapter-content';
import { useChatContext } from './chat-context';
import type { SectionContent } from '@/types/materials';
import type { Note } from '@/types/notes';

interface ChapterContentWithChatProps {
  chapter: {
    id: string;
    title: string;
    description: string;
    topics: string[];
    estimatedMinutes: number;
  };
  courseContext?: string;
  initialContent?: SectionContent | null;
  initialNotes?: Note[];
  courseId?: string;
}

export function ChapterContentWithChat(props: ChapterContentWithChatProps) {
  const chatContext = useChatContext();

  return (
    <ChapterContent
      {...props}
      onAskMentor={chatContext?.askMentor}
    />
  );
}
