"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb, BookOpen, CheckCircle, RefreshCw } from "lucide-react";
import type { RemediationContent as RemediationType } from "@/types/quiz";

interface RemediationContentProps {
  remediation: RemediationType;
  onComplete?: () => void;
  onRetry?: () => void;
}

export function RemediationContent({
  remediation,
  onComplete,
  onRetry,
}: RemediationContentProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BookOpen className="h-5 w-5" />
          Material uzupelniajacy
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Weak concepts */}
        {remediation.weakConcepts.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            {remediation.weakConcepts.map((concept, i) => (
              <AccordionItem key={i} value={`concept-${i}`}>
                <AccordionTrigger>
                  <div className="flex items-center gap-2">
                    <Lightbulb className="h-4 w-4 text-yellow-500" />
                    {concept.concept}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3">
                  <p>{concept.explanation}</p>
                  <div className="bg-muted p-3 rounded-lg">
                    <p className="text-sm font-medium mb-1">Przyklad:</p>
                    <p className="text-sm text-muted-foreground">
                      {concept.example}
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}

        {/* Practice hints */}
        {remediation.practiceHints.length > 0 && (
          <div>
            <h4 className="font-medium mb-2 flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Wskazowki do cwiczen
            </h4>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              {remediation.practiceHints.map((hint, i) => (
                <li key={i}>{hint}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggested review */}
        {remediation.suggestedReview.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">Warto przejrzec:</h4>
            <div className="flex flex-wrap gap-2">
              {remediation.suggestedReview.map((item, i) => (
                <Badge key={i} variant="outline">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-4 pt-4">
          {onRetry && (
            <Button onClick={onRetry} variant="default">
              <RefreshCw className="mr-2 h-4 w-4" />
              Sprobuj ponownie
            </Button>
          )}
          {onComplete && (
            <Button onClick={onComplete} variant="outline">
              Zamknij
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
