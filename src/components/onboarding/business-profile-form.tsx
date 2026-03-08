/**
 * Business Profile Form
 *
 * Collects user's business context: industry, role, goal, and company size.
 * Uses Combobox for industry/role (with custom value support)
 * and Select for company size.
 */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { Combobox, type ComboboxOption } from "./combobox";
import { businessProfileSchema } from "@/lib/onboarding/schemas";
import { saveBusinessProfile } from "@/lib/onboarding/onboarding-dal";
import type { BusinessProfile } from "@/types/onboarding";

// --- Options ---

const INDUSTRY_OPTIONS: ComboboxOption[] = [
  { value: "IT / Technologia", label: "IT / Technologia" },
  { value: "Marketing / Reklama", label: "Marketing / Reklama" },
  { value: "Finanse / Bankowość", label: "Finanse / Bankowość" },
  { value: "E-commerce", label: "E-commerce" },
  { value: "Edukacja", label: "Edukacja" },
  { value: "Zdrowie / Medycyna", label: "Zdrowie / Medycyna" },
  { value: "Produkcja / Przemysł", label: "Produkcja / Przemysł" },
  { value: "Usługi profesjonalne", label: "Usługi profesjonalne" },
  { value: "Nieruchomości", label: "Nieruchomości" },
  { value: "Gastronomia / HoReCa", label: "Gastronomia / HoReCa" },
  { value: "Transport / Logistyka", label: "Transport / Logistyka" },
  { value: "Inne", label: "Inne" },
];

const ROLE_OPTIONS: ComboboxOption[] = [
  { value: "Właściciel firmy", label: "Właściciel firmy" },
  { value: "CEO / Dyrektor", label: "CEO / Dyrektor" },
  { value: "Manager / Kierownik", label: "Manager / Kierownik" },
  { value: "Specjalista", label: "Specjalista" },
  { value: "Freelancer / Konsultant", label: "Freelancer / Konsultant" },
  { value: "Student / Początkujący", label: "Student / Początkujący" },
  { value: "Inne", label: "Inne" },
];

const COMPANY_SIZE_OPTIONS = [
  { value: "1", label: "1 osoba (soloprzedsiębiorca)" },
  { value: "2-10", label: "2-10" },
  { value: "11-50", label: "11-50" },
  { value: "51-200", label: "51-200" },
  { value: "201-1000", label: "201-1000" },
  { value: "1000+", label: "1000+" },
];

// --- Component ---

interface BusinessProfileFormProps {
  initialData?: BusinessProfile | null;
  onSuccess?: () => void;
}

export function BusinessProfileForm({
  initialData,
  onSuccess,
}: BusinessProfileFormProps) {
  const router = useRouter();

  // Controlled form state
  const [industry, setIndustry] = useState(initialData?.industry ?? "");
  const [role, setRole] = useState(initialData?.role ?? "");
  const [businessGoal, setBusinessGoal] = useState(
    initialData?.business_goal ?? ""
  );
  const [companySize, setCompanySize] = useState(
    initialData?.company_size ?? ""
  );

  // UI state
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});

    const formData = {
      industry,
      role,
      business_goal: businessGoal,
      company_size: companySize || undefined,
    };

    // Validate with Zod
    const result = businessProfileSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0];
        if (field && typeof field === "string") {
          fieldErrors[field] = issue.message;
        }
      }
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    try {
      const response = await saveBusinessProfile(result.data);
      if (response.success) {
        toast.success("Profil zapisany");
        if (onSuccess) {
          onSuccess();
        } else {
          router.push("/dashboard");
        }
      } else {
        toast.error(response.error || "Nie udało się zapisać profilu");
      }
    } catch {
      toast.error("Wystąpił nieoczekiwany błąd");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil biznesowy</CardTitle>
        <CardDescription>
          Opowiedz nam o swoim biznesie, a my dostosujemy do Ciebie kursy i
          sugestie
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Industry */}
          <div className="space-y-2">
            <Label htmlFor="industry">Branża</Label>
            <Combobox
              options={INDUSTRY_OPTIONS}
              value={industry}
              onChange={setIndustry}
              placeholder="Wybierz branżę..."
              searchPlaceholder="Szukaj branży..."
              emptyMessage="Nie znaleziono branży."
              allowCustom
            />
            {errors.industry && (
              <p className="text-sm text-destructive">{errors.industry}</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-2">
            <Label htmlFor="role">Rola</Label>
            <Combobox
              options={ROLE_OPTIONS}
              value={role}
              onChange={setRole}
              placeholder="Wybierz rolę..."
              searchPlaceholder="Szukaj roli..."
              emptyMessage="Nie znaleziono roli."
              allowCustom
            />
            {errors.role && (
              <p className="text-sm text-destructive">{errors.role}</p>
            )}
          </div>

          {/* Business Goal */}
          <div className="space-y-2">
            <Label htmlFor="business_goal">Cel biznesowy</Label>
            <Textarea
              id="business_goal"
              value={businessGoal}
              onChange={(e) => setBusinessGoal(e.target.value)}
              placeholder="Np. Chcę wdrożyć AI w obsłudze klienta"
              maxLength={200}
              rows={3}
            />
            <div className="flex justify-between">
              {errors.business_goal ? (
                <p className="text-sm text-destructive">
                  {errors.business_goal}
                </p>
              ) : (
                <span />
              )}
              <p className="text-xs text-muted-foreground">
                {businessGoal.length}/200
              </p>
            </div>
          </div>

          {/* Company Size */}
          <div className="space-y-2">
            <Label htmlFor="company_size">
              Wielkość firmy{" "}
              <span className="text-muted-foreground font-normal">
                (opcjonalne)
              </span>
            </Label>
            <Select value={companySize} onValueChange={setCompanySize}>
              <SelectTrigger id="company_size" className="w-full">
                <SelectValue placeholder="Wybierz wielkość firmy..." />
              </SelectTrigger>
              <SelectContent>
                {COMPANY_SIZE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button type="submit" disabled={loading} className="flex-1">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zapisz profil
            </Button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="flex-1">
                    <Button
                      type="button"
                      variant="secondary"
                      disabled
                      className="w-full"
                    >
                      <Sparkles className="mr-2 h-4 w-4" />
                      Doprecyzuj z AI
                    </Button>
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Wkrótce dostępne</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
