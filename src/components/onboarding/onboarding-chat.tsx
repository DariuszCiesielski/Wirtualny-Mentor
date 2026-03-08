"use client";

/**
 * Onboarding Chat Component
 *
 * Short AI conversation (2-3 questions) to clarify user's business context.
 * Generates experience_summary after collecting enough information.
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
import { MessageCircle, Send, ArrowRight, Loader2, SkipForward } from "lucide-react";
import { cn } from "@/lib/utils";
import { saveBusinessProfile } from "@/lib/onboarding/onboarding-dal";
import type { OnboardingChatResponse } from "@/lib/onboarding/schemas";

interface ProfileData {
  industry: string;
  role: string;
  business_goal: string;
  company_size?: string;
}

interface OnboardingChatProps {
  profileData: ProfileData;
  onComplete: (experienceSummary: string) => void;
}

/**
 * Extract text content from UIMessage parts
 */
function getMessageText(
  parts: Array<{ type: string; text?: string }>
): string {
  return parts
    .filter((p) => p.type === "text" && p.text)
    .map((p) => p.text)
    .join("");
}

export function OnboardingChat({
  profileData,
  onComplete,
}: OnboardingChatProps) {
  const [input, setInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const initialSent = useRef(false);
  const completionCalled = useRef(false);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/onboarding/chat",
        body: { profileData },
      }),
    [profileData]
  );

  const { messages, sendMessage, status } = useChat({
    transport,
  });

  const isLoading = status === "streaming" || status === "submitted";

  // Count user turns
  const userTurns = useMemo(() => {
    return messages.filter((m) => m.role === "user").length;
  }, [messages]);

  // Parse structured response from AI message
  const parseAIResponse = useCallback(
    (content: string): OnboardingChatResponse | null => {
      try {
        return JSON.parse(content) as OnboardingChatResponse;
      } catch {
        return null;
      }
    },
    []
  );

  // Check latest AI message for isComplete
  const latestParsed = useMemo(() => {
    const lastAssistant = [...messages]
      .reverse()
      .find((m) => m.role === "assistant");
    if (!lastAssistant) return null;
    const content = getMessageText(lastAssistant.parts);
    return parseAIResponse(content);
  }, [messages, parseAIResponse]);

  const showFinishButton =
    (latestParsed?.isComplete || userTurns >= 5) && !completionCalled.current;

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send initial message
  useEffect(() => {
    if (!initialSent.current) {
      initialSent.current = true;
      const intro = `Cześć! Jestem z branży ${profileData.industry}, pracuję jako ${profileData.role}. Mój cel biznesowy: ${profileData.business_goal}.`;
      sendMessage({ text: intro });
    }
  }, [profileData, sendMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;
    sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleFinishAndSave = useCallback(async () => {
    if (completionCalled.current || isSaving) return;
    completionCalled.current = true;
    setIsSaving(true);

    // Get experience_summary from latest parsed response, or build from messages
    const summary =
      latestParsed?.experience_summary ||
      "Profil uzupełniony na podstawie rozmowy z AI.";

    const result = await saveBusinessProfile({
      industry: profileData.industry,
      role: profileData.role,
      business_goal: profileData.business_goal,
      company_size: profileData.company_size,
      experience_summary: summary,
    });

    setIsSaving(false);

    if (result.success) {
      onCompleteRef.current(summary);
    } else {
      // Reset on error
      completionCalled.current = false;
      console.error("[onboarding-chat] Save failed:", result.error);
    }
  }, [latestParsed, profileData, isSaving]);

  const handleSkip = useCallback(async () => {
    if (completionCalled.current || isSaving) return;
    completionCalled.current = true;
    setIsSaving(true);

    const result = await saveBusinessProfile({
      industry: profileData.industry,
      role: profileData.role,
      business_goal: profileData.business_goal,
      company_size: profileData.company_size,
    });

    setIsSaving(false);

    if (result.success) {
      onCompleteRef.current("");
    } else {
      completionCalled.current = false;
      console.error("[onboarding-chat] Skip save failed:", result.error);
    }
  }, [profileData, isSaving]);

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <MessageCircle className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle>Doprecyzuj z AI</CardTitle>
            <CardDescription>
              AI zada kilka pytań, aby lepiej poznać Twoje doświadczenie
              biznesowe
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Messages */}
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
                  <p className="text-sm whitespace-pre-wrap">
                    {parsed ? parsed.question : messageContent}
                  </p>
                </div>
              </div>
            );
          })}

          {/* Loading */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-lg px-4 py-2">
                <Loader2 className="h-4 w-4 animate-spin" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {!showFinishButton && (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Wpisz odpowiedź..."
              disabled={isLoading || isSaving}
              className="flex-1"
            />
            <Button
              type="submit"
              disabled={isLoading || !input.trim() || isSaving}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        )}

        {/* Finish button */}
        {showFinishButton && (
          <div className="pt-2 border-t">
            <Button
              onClick={handleFinishAndSave}
              disabled={isSaving}
              className="w-full"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <ArrowRight className="h-4 w-4 mr-2" />
              )}
              Zakończ i zapisz
            </Button>
          </div>
        )}

        {/* Skip button */}
        {!showFinishButton && (
          <div className="pt-2 border-t">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              disabled={isSaving || isLoading}
              className="w-full text-muted-foreground"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <SkipForward className="h-4 w-4 mr-2" />
              )}
              Przejdź dalej bez chatu
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
