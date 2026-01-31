"use client";

/**
 * Notes Search Component
 *
 * Full-text search for user notes with debounced input.
 * Displays search results with context (chapter, level).
 */

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2, FileText, ArrowRight } from "lucide-react";
import type { NoteWithContext } from "@/types/notes";

interface NotesSearchProps {
  courseId: string;
  /** Server action to search notes */
  searchAction: (query: string) => Promise<NoteWithContext[]>;
}

export function NotesSearch({ courseId, searchAction }: NotesSearchProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<NoteWithContext[]>([]);
  const [isPending, startTransition] = useTransition();
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = (value: string) => {
    setQuery(value);

    if (value.trim().length < 2) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    startTransition(async () => {
      const searchResults = await searchAction(value.trim());
      setResults(searchResults);
      setHasSearched(true);
    });
  };

  const handleNoteClick = (note: NoteWithContext) => {
    if (note.chapter_id) {
      // Navigate to the chapter - we need level_id
      // For now navigate to notes page with anchor
      router.push(`/courses/${courseId}/notes#note-${note.id}`);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pl-PL", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const truncateContent = (content: string, maxLength = 150) => {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength).trim() + "...";
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Szukaj w notatkach..."
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          className="pl-10 pr-10"
        />
        {isPending && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {/* Search Results */}
      {hasSearched && query.trim().length >= 2 && (
        <div className="space-y-2">
          {results.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Brak wynikow dla &ldquo;{query}&rdquo;
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Znaleziono: {results.length}{" "}
                {results.length === 1 ? "notatke" : "notatek"}
              </p>
              <div className="space-y-2">
                {results.map((note) => (
                  <SearchResultCard
                    key={note.id}
                    note={note}
                    query={query}
                    onClick={() => handleNoteClick(note)}
                    formatDate={formatDate}
                    truncateContent={truncateContent}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

interface SearchResultCardProps {
  note: NoteWithContext;
  query: string;
  onClick: () => void;
  formatDate: (date: string) => string;
  truncateContent: (content: string, maxLength?: number) => string;
}

function SearchResultCard({
  note,
  onClick,
  formatDate,
  truncateContent,
}: SearchResultCardProps) {
  return (
    <Card
      className="cursor-pointer hover:bg-accent/50 transition-colors py-3"
      onClick={onClick}
    >
      <CardContent className="px-4 py-0">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            {/* Context badges */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {note.level_name && (
                <Badge variant="secondary" className="text-xs">
                  {note.level_name}
                </Badge>
              )}
              {note.chapter_title && (
                <Badge variant="outline" className="text-xs">
                  {note.chapter_title}
                </Badge>
              )}
            </div>

            {/* Note content preview */}
            <p className="text-sm text-foreground">
              {truncateContent(note.content)}
            </p>

            {/* Date */}
            <p className="text-xs text-muted-foreground mt-1.5">
              {formatDate(note.created_at)}
            </p>
          </div>

          {/* Navigation indicator */}
          {note.chapter_id && (
            <div className="flex items-center text-muted-foreground">
              <FileText className="h-4 w-4 mr-1" />
              <ArrowRight className="h-3 w-3" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export type { NotesSearchProps };
