'use client';

/**
 * Business Ideas Client Component
 *
 * Client wrapper with course filter, sort, expand/collapse state,
 * and optimistic un-bookmark functionality.
 */

import { useState, useMemo, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Info } from 'lucide-react';
import { toast } from 'sonner';
import { bookmarkSuggestion } from '@/lib/business-ideas/ideas-dal';
import { IdeaCard } from '@/components/business-ideas/IdeaCard';
import type {
  BookmarkedSuggestionWithContext,
  ContactInfo,
} from '@/types/business-ideas';

const complexityOrder: Record<string, number> = {
  prosty: 1,
  sredni: 2,
  zlozony: 3,
};

interface BusinessIdeasClientProps {
  suggestions: BookmarkedSuggestionWithContext[];
  courses: { id: string; title: string }[];
  contactInfo: ContactInfo | null;
}

export function BusinessIdeasClient({
  suggestions,
  courses,
  contactInfo,
}: BusinessIdeasClientProps) {
  const [items, setItems] = useState(suggestions);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'complexity'>('date');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    // First 3 items expanded by default
    return new Set(suggestions.slice(0, 3).map((s) => s.id));
  });

  const filteredSuggestions = useMemo(() => {
    let filtered = items;

    if (selectedCourseId !== 'all') {
      filtered = filtered.filter((s) => s.course_id === selectedCourseId);
    }

    if (sortBy === 'date') {
      filtered = [...filtered].sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      filtered = [...filtered].sort(
        (a, b) =>
          (complexityOrder[a.estimated_complexity] ?? 2) -
          (complexityOrder[b.estimated_complexity] ?? 2)
      );
    }

    return filtered;
  }, [items, selectedCourseId, sortBy]);

  // Reset expanded state when filter changes
  useEffect(() => {
    setExpandedIds(
      new Set(filteredSuggestions.slice(0, 3).map((s) => s.id))
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCourseId]);

  const handleToggleExpand = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleRemoveBookmark = useCallback(
    async (id: string) => {
      // Optimistic remove
      const previousItems = items;
      setItems((prev) => prev.filter((s) => s.id !== id));
      setExpandedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });

      const result = await bookmarkSuggestion(id);

      if (!result.success) {
        // Restore on failure
        setItems(previousItems);
        toast.error('Nie udało się usunąć z zapisanych. Spróbuj ponownie.');
      }
    },
    [items]
  );

  // Check if user has any courses at all (no courses = no suggestions possible)
  const hasNoCourses = courses.length === 0 && suggestions.length === 0;

  // No bookmarks at all
  const hasNoBookmarks = !hasNoCourses && items.length === 0;

  // Filter returned no results
  const filterNoResults =
    !hasNoCourses &&
    !hasNoBookmarks &&
    filteredSuggestions.length === 0 &&
    selectedCourseId !== 'all';

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-3">
          <Lightbulb className="h-8 w-8 text-amber-500" />
          Pomysły biznesowe
        </h1>
        <p className="text-muted-foreground mt-2">
          Zapisane pomysły z Twoich kursów
        </p>
      </header>

      {/* Disclaimer */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Informacja</AlertTitle>
        <AlertDescription>
          Pomysły na tej stronie mają charakter inspiracyjny i edukacyjny. Przed
          wdrożeniem oceń ich wykonalność, koszty i dopasowanie do swojej firmy.
        </AlertDescription>
      </Alert>

      {/* Empty states */}
      {hasNoCourses && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center px-4 py-0">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">Brak kursów</h3>
            <p className="text-muted-foreground mb-4">
              Nie masz jeszcze kursów, więc nie ma z czego tworzyć pomysłów
              biznesowych.
            </p>
            <Button asChild>
              <Link href="/courses/new">Utwórz pierwszy kurs</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {hasNoBookmarks && (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center px-4 py-0">
            <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Brak zapisanych pomysłów
            </h3>
            <p className="text-muted-foreground mb-4">
              Nie masz jeszcze zapisanych pomysłów. Podczas czytania lekcji
              kliknij ikonę żarówki, żeby wygenerować sugestię, a potem zapisz
              te, do których chcesz wrócić.
            </p>
            <Button asChild variant="outline">
              <Link href="/courses">Przejdź do kursów</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Filters + list */}
      {!hasNoCourses && !hasNoBookmarks && (
        <>
          {/* Filter row */}
          <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
            <Select
              value={selectedCourseId}
              onValueChange={setSelectedCourseId}
            >
              <SelectTrigger className="w-full sm:w-[250px]">
                <SelectValue placeholder="Wszystkie kursy" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Wszystkie kursy</SelectItem>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as 'date' | 'complexity')}
            >
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="date">Sortuj: od najnowszych</SelectItem>
                <SelectItem value="complexity">
                  Sortuj: po złożoności
                </SelectItem>
              </SelectContent>
            </Select>

            <Badge variant="secondary" className="shrink-0">
              {filteredSuggestions.length}{' '}
              {filteredSuggestions.length === 1
                ? 'pomysł'
                : filteredSuggestions.length < 5
                  ? 'pomysły'
                  : 'pomysłów'}
            </Badge>
          </div>

          {/* Filter no results */}
          {filterNoResults && (
            <Card className="py-12">
              <CardContent className="flex flex-col items-center justify-center text-center px-4 py-0">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Brak wyników</h3>
                <p className="text-muted-foreground mb-4">
                  Brak zapisanych pomysłów dla wybranego kursu.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCourseId('all')}
                >
                  Wyczyść filtr
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Idea cards */}
          {!filterNoResults && (
            <div className="space-y-4">
              {filteredSuggestions.map((suggestion) => (
                <IdeaCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  isExpanded={expandedIds.has(suggestion.id)}
                  onToggleExpand={() => handleToggleExpand(suggestion.id)}
                  onRemoveBookmark={() => handleRemoveBookmark(suggestion.id)}
                  contactInfo={contactInfo}
                />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
