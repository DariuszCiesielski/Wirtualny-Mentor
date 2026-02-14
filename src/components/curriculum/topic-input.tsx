"use client";

/**
 * Topic Input Component
 *
 * Form for entering learning topic, uploading source materials,
 * and optional source URLs. First step in course creation flow.
 *
 * Supports two modes:
 * 1. Topic only (original) - user enters topic, AI generates from scratch
 * 2. Materials-based - user uploads files, topic auto-detected or entered manually
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
import { BookOpen, Link as LinkIcon, Plus, X, Globe, Sparkles, Loader2 } from "lucide-react";
import { FileUploadZone } from "./file-upload-zone";
import { useFileUpload } from "@/hooks/useFileUpload";
import type { TopicSubmitData } from "@/types/source-documents";

interface TopicInputProps {
  onSubmit: (data: TopicSubmitData) => void;
  isLoading?: boolean;
}

export function TopicInput({ onSubmit, isLoading = false }: TopicInputProps) {
  const [topic, setTopic] = useState("");
  const [sourceUrls, setSourceUrls] = useState<string[]>([""]);
  const [urlErrors, setUrlErrors] = useState<(string | null)[]>([null]);
  const [useWebSearch, setUseWebSearch] = useState(true);
  const [isSuggestingTopic, setIsSuggestingTopic] = useState(false);

  const {
    files,
    uploadFiles,
    removeFile,
    retryEmbedding,
    isProcessing,
    completedDocumentIds,
    hasFiles,
  } = useFileUpload();

  // Topic valid if >=3 chars OR has completed files (topic will be auto-suggested)
  const isTopicValid = topic.trim().length >= 3;
  const canSubmit =
    (isTopicValid || completedDocumentIds.length > 0) &&
    !isProcessing &&
    !isLoading;

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

  const handleSuggestTopic = async () => {
    if (completedDocumentIds.length === 0) return;

    setIsSuggestingTopic(true);
    try {
      const response = await fetch("/api/curriculum/suggest-topic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ documentIds: completedDocumentIds }),
      });

      if (response.ok) {
        const { topic: suggested } = await response.json();
        if (suggested) {
          setTopic(suggested);
        }
      }
    } catch (err) {
      console.error("Failed to suggest topic:", err);
    } finally {
      setIsSuggestingTopic(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    if (hasAnyUrlError) return;

    // Combine valid URLs into single string (separated by newlines)
    const combinedUrls = validUrls.length > 0 ? validUrls.join("\n") : undefined;

    onSubmit({
      topic: topic.trim(),
      sourceUrl: combinedUrls,
      uploadedDocumentIds: completedDocumentIds,
      useWebSearch,
    });
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
              Załaduj materiały szkoleniowe lub podaj temat do nauki
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* File upload zone */}
          <div className="space-y-2">
            <label className="text-sm font-medium leading-none">
              Materiały źródłowe
            </label>
            <FileUploadZone
              files={files}
              onFilesSelected={(fileList) => uploadFiles(fileList)}
              onFileRemoved={removeFile}
              onRetry={retryEmbedding}
              isProcessing={isProcessing}
              disabled={isLoading}
            />
          </div>

          {/* Topic textarea */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label
                htmlFor="topic"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Temat nauki
                {hasFiles && (
                  <span className="text-muted-foreground font-normal ml-1">
                    (opcjonalny gdy są pliki)
                  </span>
                )}
              </label>
              {/* Suggest topic button */}
              {completedDocumentIds.length > 0 && !topic.trim() && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleSuggestTopic}
                  disabled={isSuggestingTopic || isLoading}
                  className="text-xs h-7"
                >
                  {isSuggestingTopic ? (
                    <Loader2 className="h-3 w-3 animate-spin mr-1" />
                  ) : (
                    <Sparkles className="h-3 w-3 mr-1" />
                  )}
                  Zaproponuj temat
                </Button>
              )}
            </div>
            <Textarea
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder={
                hasFiles
                  ? "Opcjonalnie opisz temat lub kliknij 'Zaproponuj temat'"
                  : "Czego chcesz się nauczyć? np. 'programowanie w Python' lub 'prawo cywilne w Polsce'"
              }
              className="min-h-[100px] resize-none"
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              {hasFiles
                ? "AI przeanalizuje materiały i dopasuje program kursu do ich treści"
                : "Opisz temat możliwie dokładnie - AI dostosuje program do Twoich potrzeb"}
            </p>
          </div>

          {/* Web search checkbox - visible when files are uploaded */}
          {hasFiles && (
            <div className="flex items-start gap-3 rounded-lg border p-3 bg-muted/30">
              <input
                type="checkbox"
                id="useWebSearch"
                checked={useWebSearch}
                onChange={(e) => setUseWebSearch(e.target.checked)}
                disabled={isLoading}
                className="mt-0.5 h-4 w-4 rounded border-muted-foreground/30"
              />
              <label htmlFor="useWebSearch" className="flex-1 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Globe className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">
                    Uzupełnij danymi z internetu
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  AI wzbogaci kurs o aktualne informacje z internetu (standardy,
                  programy nauczania, nowe trendy)
                </p>
              </label>
            </div>
          )}

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
            disabled={!canSubmit || hasAnyUrlError}
            className="w-full"
          >
            {isLoading
              ? "Przetwarzanie..."
              : isProcessing
                ? "Trwa przetwarzanie plików..."
                : "Rozpocznij"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
