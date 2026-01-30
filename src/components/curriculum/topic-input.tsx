"use client";

/**
 * Topic Input Component
 *
 * Form for entering learning topic and optional source URL.
 * First step in course creation flow.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { BookOpen, Link as LinkIcon } from "lucide-react";

interface TopicInputProps {
  onSubmit: (topic: string, sourceUrl?: string) => void;
  isLoading?: boolean;
}

export function TopicInput({ onSubmit, isLoading = false }: TopicInputProps) {
  const [topic, setTopic] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);

  const isTopicValid = topic.trim().length >= 3;

  const validateUrl = (url: string): boolean => {
    if (!url.trim()) return true; // Optional field
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const handleUrlChange = (value: string) => {
    setSourceUrl(value);
    if (value && !validateUrl(value)) {
      setUrlError("Podaj poprawny adres URL");
    } else {
      setUrlError(null);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTopicValid) return;
    if (sourceUrl && !validateUrl(sourceUrl)) return;

    onSubmit(topic.trim(), sourceUrl.trim() || undefined);
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <BookOpen className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Nowy kurs</CardTitle>
            <CardDescription>
              Podaj temat, ktorego chcesz sie nauczyc
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Topic textarea */}
          <div className="space-y-2">
            <label
              htmlFor="topic"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Temat nauki
            </label>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Czego chcesz sie nauczyc? np. 'programowanie w Python' lub 'prawo cywilne w Polsce'"
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Opisz temat mozliwie dokladnie - AI dostosuje program do Twoich
              potrzeb
            </p>
          </div>

          {/* Source URL input */}
          <div className="space-y-2">
            <label
              htmlFor="sourceUrl"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              <span className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Link do zrodla (opcjonalnie)
              </span>
            </label>
            <Input
              id="sourceUrl"
              type="url"
              value={sourceUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="Opcjonalnie: link do materialu, na podstawie ktorego chcesz sie uczyc"
              disabled={isLoading}
              aria-invalid={!!urlError}
            />
            {urlError && <p className="text-xs text-destructive">{urlError}</p>}
            <p className="text-xs text-muted-foreground">
              Mozesz podac link do artykulu, kursu online lub dokumentacji
            </p>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={!isTopicValid || !!urlError || isLoading}
            className="w-full"
          >
            {isLoading ? "Przetwarzanie..." : "Rozpocznij"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
