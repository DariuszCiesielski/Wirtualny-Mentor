"use client";

/**
 * Topic Input Component
 *
 * Form for entering learning topic and optional source URLs.
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
import { BookOpen, Link as LinkIcon, Plus, X } from "lucide-react";

interface TopicInputProps {
  onSubmit: (topic: string, sourceUrl?: string) => void;
  isLoading?: boolean;
}

export function TopicInput({ onSubmit, isLoading = false }: TopicInputProps) {
  const [topic, setTopic] = useState("");
  const [sourceUrls, setSourceUrls] = useState<string[]>([""]);
  const [urlErrors, setUrlErrors] = useState<(string | null)[]>([null]);

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

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...sourceUrls];
    newUrls[index] = value;
    setSourceUrls(newUrls);

    const newErrors = [...urlErrors];
    if (value && !validateUrl(value)) {
      newErrors[index] = "Podaj poprawny adres URL";
    } else {
      newErrors[index] = null;
    }
    setUrlErrors(newErrors);
  };

  const addUrlField = () => {
    setSourceUrls([...sourceUrls, ""]);
    setUrlErrors([...urlErrors, null]);
  };

  const removeUrlField = (index: number) => {
    if (sourceUrls.length <= 1) return;
    const newUrls = sourceUrls.filter((_, i) => i !== index);
    const newErrors = urlErrors.filter((_, i) => i !== index);
    setSourceUrls(newUrls);
    setUrlErrors(newErrors);
  };

  const hasAnyUrlError = urlErrors.some((error) => error !== null);
  const validUrls = sourceUrls.filter((url) => url.trim() && validateUrl(url));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isTopicValid) return;
    if (hasAnyUrlError) return;

    // Combine valid URLs into single string (separated by newlines)
    const combinedUrls = validUrls.length > 0 ? validUrls.join("\n") : undefined;
    onSubmit(topic.trim(), combinedUrls);
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
              Podaj temat, którego chcesz się nauczyć
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
              placeholder="Czego chcesz się nauczyć? np. 'programowanie w Python' lub 'prawo cywilne w Polsce'"
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Opisz temat możliwie dokładnie - AI dostosuje program do Twoich
              potrzeb
            </p>
          </div>

          {/* Source URLs input */}
          <div className="space-y-3">
            <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              <span className="flex items-center gap-2">
                <LinkIcon className="h-4 w-4" />
                Linki do źródeł (opcjonalnie)
              </span>
            </label>

            {sourceUrls.map((url, index) => (
              <div key={index} className="flex gap-2">
                <div className="flex-1 space-y-1">
                  <Input
                    type="url"
                    value={url}
                    onChange={(e) => handleUrlChange(index, e.target.value)}
                    placeholder="https://example.com/material"
                    disabled={isLoading}
                    aria-invalid={!!urlErrors[index]}
                  />
                  {urlErrors[index] && (
                    <p className="text-xs text-destructive">{urlErrors[index]}</p>
                  )}
                </div>
                {sourceUrls.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeUrlField(index)}
                    disabled={isLoading}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            ))}

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addUrlField}
              disabled={isLoading}
              className="w-full"
            >
              <Plus className="h-4 w-4 mr-2" />
              Dodaj kolejny link
            </Button>

            <p className="text-xs text-muted-foreground">
              Możesz podać linki do artykułów, kursów online lub dokumentacji
            </p>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            disabled={!isTopicValid || hasAnyUrlError || isLoading}
            className="w-full"
          >
            {isLoading ? "Przetwarzanie..." : "Rozpocznij"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
