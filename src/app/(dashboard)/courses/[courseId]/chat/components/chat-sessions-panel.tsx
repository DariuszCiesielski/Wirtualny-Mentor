'use client';

/**
 * Chat Sessions Panel
 *
 * Sidebar listing chat sessions for a course.
 * Supports creating, renaming, and deleting sessions.
 * Responsive: collapsible on mobile via Sheet.
 */

import { useTransition, useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Plus,
  MessageSquare,
  MoreVertical,
  Pencil,
  Trash2,
  PanelLeftOpen,
  Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  createSessionAction,
  deleteSessionAction,
  renameSessionAction,
} from '../actions';
import type { ChatSession } from '@/types/chat';

interface ChatSessionsPanelProps {
  courseId: string;
  sessions: ChatSession[];
  activeSessionId: string | null;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'dzisiaj';
  if (diffDays === 1) return 'wczoraj';
  if (diffDays < 7) return `${diffDays} dni temu`;

  return date.toLocaleDateString('pl-PL', {
    day: 'numeric',
    month: 'short',
  });
}

function SessionItem({
  session,
  isActive,
  courseId,
  onNavigate,
}: {
  session: ChatSession;
  isActive: boolean;
  courseId: string;
  onNavigate?: () => void;
}) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(session.title);
  const [isPending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isRenaming]);

  const handleRename = () => {
    const trimmed = renameValue.trim();
    if (!trimmed || trimmed === session.title) {
      setIsRenaming(false);
      setRenameValue(session.title);
      return;
    }
    startTransition(async () => {
      await renameSessionAction(courseId, session.id, trimmed);
      setIsRenaming(false);
    });
  };

  const handleDelete = () => {
    if (!confirm('Usunąć tę rozmowę? Tej operacji nie można cofnąć.')) return;
    startTransition(async () => {
      await deleteSessionAction(courseId, session.id);
      if (isActive) {
        router.push(`/courses/${courseId}/chat`);
      }
    });
  };

  const handleClick = () => {
    if (!isActive && !isRenaming) {
      router.push(`/courses/${courseId}/chat?session=${session.id}`);
      onNavigate?.();
    }
  };

  return (
    <div
      className={cn(
        'group flex items-center gap-2 rounded-md px-3 py-2 text-sm cursor-pointer transition-colors',
        isActive
          ? 'bg-primary/10 text-primary font-medium'
          : 'hover:bg-muted text-muted-foreground'
      )}
      onClick={handleClick}
    >
      <MessageSquare className="h-4 w-4 shrink-0" />

      {isRenaming ? (
        <Input
          ref={inputRef}
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRename}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleRename();
            if (e.key === 'Escape') {
              setIsRenaming(false);
              setRenameValue(session.title);
            }
          }}
          className="h-6 text-sm px-1"
          maxLength={100}
          disabled={isPending}
        />
      ) : (
        <div className="flex-1 min-w-0">
          <p className="truncate">{session.title}</p>
          <p className="text-xs text-muted-foreground/60">
            {formatDate(session.updated_at)}
          </p>
        </div>
      )}

      {!isRenaming && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-muted-foreground/10 transition-opacity"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                setIsRenaming(true);
              }}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Zmień nazwę
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation();
                handleDelete();
              }}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Usuń
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

function SessionsList({
  courseId,
  sessions,
  activeSessionId,
  onNavigate,
}: ChatSessionsPanelProps & { onNavigate?: () => void }) {
  const [isPending, startTransition] = useTransition();

  const handleNewSession = () => {
    startTransition(async () => {
      await createSessionAction(courseId);
    });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-3 border-b">
        <Button
          onClick={handleNewSession}
          disabled={isPending}
          className="w-full"
          size="sm"
        >
          {isPending ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plus className="h-4 w-4 mr-2" />
          )}
          Nowa rozmowa
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {sessions.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8 px-4">
            Brak rozmów. Rozpocznij nową rozmowę z mentorem.
          </p>
        ) : (
          sessions.map((session) => (
            <SessionItem
              key={session.id}
              session={session}
              isActive={session.id === activeSessionId}
              courseId={courseId}
              onNavigate={onNavigate}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function ChatSessionsPanel({
  courseId,
  sessions,
  activeSessionId,
}: ChatSessionsPanelProps) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden lg:flex w-64 border-r flex-col">
        <SessionsList
          courseId={courseId}
          sessions={sessions}
          activeSessionId={activeSessionId}
        />
      </div>

      {/* Mobile sheet trigger + sheet */}
      <div className="lg:hidden absolute top-3 left-3 z-10">
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8">
              <PanelLeftOpen className="h-4 w-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0">
            <SheetHeader className="p-4 pb-0">
              <SheetTitle>Rozmowy</SheetTitle>
            </SheetHeader>
            <SessionsList
              courseId={courseId}
              sessions={sessions}
              activeSessionId={activeSessionId}
              onNavigate={() => setSheetOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}
