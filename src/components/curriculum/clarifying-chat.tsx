"use client";

/**
 * Clarifying Chat Component
 *
 * Chat interface for AI clarifying questions during course creation.
 * Uses useChat hook to communicate with /api/curriculum/clarify endpoint.
 */

import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { MessageCircle, Send, ArrowRight, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ClarificationResponse } from "@/lib/ai/curriculum/schemas";

// Collected info from AI clarification (flexible type for OpenAI compatibility)
type CollectedInfo = ClarificationResponse['collectedInfo'];

interface ClarifyingChatProps {
  topic: string;
  sourceUrl?: string;
  uploadedDocumentIds?: string[];
  useWebSearch?: boolean;
  onComplete: (info: CollectedInfo) => void;
}

/**
 * Extract text content from UIMessage parts
 */
function getMessageText(parts: Array<{ type: string; text?: string }>): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("");
}

export function ClarifyingChat({
  topic,
  sourceUrl,
  uploadedDocumentIds,
  useWebSearch,
  onComplete,
}: ClarifyingChatProps) {
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);
  const completionCalled = useRef(false);
  const onCompleteRef = useRef(onComplete);

  // Keep ref in sync with prop
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const hasDocuments = uploadedDocumentIds && uploadedDocumentIds.length > 0;

  const initialMessage = hasDocuments
    ? `Załadowałem materiały szkoleniowe i chcę stworzyć na ich podstawie kurs. Temat: ${topic || "(do ustalenia na podstawie materiałów)"}`
    : sourceUrl
      ? `Chcę się nauczyć na podstawie tego źródła: ${sourceUrl}. Temat: ${topic}`
      : `Chcę się nauczyć: ${topic}`;

  const transport = useMemo(
    () => new DefaultChatTransport({
      api: "/api/curriculum/clarify",
      body: {
        documentIds: uploadedDocumentIds ?? [],
        useWebSearch: useWebSearch ?? true,
      },
    }),
    [uploadedDocumentIds, useWebSearch]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Count assistant turns from messages
  const turnsCount = useMemo(() => {
    return messages.filter((m) => m.role === "assistant").length;
  }, [messages]);

  // Check for completion in latest AI message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant") {
      // Try to parse structured response from message parts
      const content = getMessageText(lastMessage.parts);
      try {
        const parsed = JSON.parse(content) as ClarificationResponse;
        if (parsed.isComplete && parsed.collectedInfo && !completionCalled.current) {
          completionCalled.current = true;
          onCompleteRef.current(parsed.collectedInfo);
        }
      } catch {
        // Not JSON, continue conversation
      }
    }
  }, [messages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send initial message on mount to get first AI question
  useEffect(() => {
    if (!initialSent.current) {
      initialSent.current = true;
      sendMessage({ text: initialMessage });
    }
  }, [initialMessage, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleOptionClick = (option: string) => {
    sendMessage({ text: option });
  };

  const handleForceComplete = useCallback(() => {
    // Prevent duplicate completion
    if (completionCalled.current) return;
    completionCalled.current = true;

    // Force completion with whatever info we have
    const collectedInfo: CollectedInfo = {
      topic,
      goals: [],
      experience: '',
      weeklyHours: 0,
      sourceUrl: sourceUrl || '',
    };
    onCompleteRef.current(collectedInfo);
  }, [topic, sourceUrl]);

  // Parse structured response from AI message
  const parseAIResponse = (content: string): ClarificationResponse | null => {
    try {
      return JSON.parse(content) as ClarificationResponse;
    } catch {
      return null;
    }
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Pytania doprecyzowujące</CardTitle>
            <CardDescription>
              {hasDocuments
                ? "AI przeanalizowało materiały i zada pytania o organizację kursu"
                : "AI zada kilka pytań, aby lepiej dopasować program do Ciebie"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages container */}
        <div className="space-y-4 max-h-[400px] overflow-y-auto p-1">
          {messages.map((message) => {
            const isUser = message.role === "user";
            const messageContent = getMessageText(message.parts);
            const parsed = !isUser ? parseAIResponse(messageContent) : null;

            return (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  isUser ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "rounded-lg px-4 py-2 max-w-[85%]",
                    isUser
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted"
                  )}
                >
                  {/* Render AI message with parsed structure */}
                  {parsed ? (
                    <div className="space-y-3">
                      <p className="text-sm">{parsed.question}</p>
                      {/* Options as clickable buttons */}
                      {parsed.options && parsed.options.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {parsed.options.map((option, idx) => (
                            <Button
                              key={idx}
                              variant="outline"
                              size="sm"
                              onClick={() => handleOptionClick(option)}
                              disabled={isLoading}
                              className="text-xs"
                            >
                              {option}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">
                      {messageContent}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input form */}
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Wpisz odpowiedź..."
            disabled={isLoading}
            className="flex-1"
          />
          <Button type="submit" disabled={isLoading || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>

        {/* Force complete button after 5 turns */}
        {turnsCount >= 5 && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              onClick={handleForceComplete}
              className="w-full"
            >
              <ArrowRight className="h-4 w-4 mr-2" />
              Przejdź dalej z zebranymi informacjami
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
