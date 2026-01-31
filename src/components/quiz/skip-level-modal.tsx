"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";

interface SkipLevelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  levelId: string;
  courseId: string;
  levelName: string;
}

export function SkipLevelModal({
  open,
  onOpenChange,
  levelId,
  courseId,
  levelName,
}: SkipLevelModalProps) {
  const router = useRouter();
  const [confirmed, setConfirmed] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);

  async function handleSkip() {
    if (!confirmed) return;
    setIsSkipping(true);

    try {
      const res = await fetch("/api/level/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId, courseId }),
      });

      if (res.ok) {
        const data = await res.json();
        onOpenChange(false);
        router.push(`/courses/${courseId}?skipped=${data.nextLevelId || levelId}`);
        router.refresh();
      }
    } finally {
      setIsSkipping(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Przeskocz poziom: {levelName}
          </DialogTitle>
          <DialogDescription>
            Czy na pewno chcesz przeskoczyc ten poziom?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="bg-yellow-50 dark:bg-yellow-950 p-4 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Uwaga:</strong> Przeskakujac poziom mozesz miec trudnosci
              z bardziej zaawansowanym materialem. Zalecamy to tylko dla osob,
              ktore juz znaja ten material.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="confirm"
              checked={confirmed}
              onCheckedChange={(checked) => setConfirmed(checked === true)}
            />
            <Label htmlFor="confirm" className="text-sm">
              Rozumiem i chce przeskoczyc ten poziom
            </Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Anuluj
          </Button>
          <Button
            onClick={handleSkip}
            disabled={!confirmed || isSkipping}
            variant="destructive"
          >
            {isSkipping ? "Przeskakuje..." : "Przeskocz"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
