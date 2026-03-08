'use client';

import { Button } from '@/components/ui/button';
import { ExternalLink, Mail, Phone } from 'lucide-react';
import type { ContactInfo } from '@/types/business-ideas';

interface ContactCTAProps {
  contactInfo: ContactInfo;
}

export function ContactCTA({ contactInfo }: ContactCTAProps) {
  if (!contactInfo.email && !contactInfo.phone && !contactInfo.formUrl) {
    return null;
  }

  const primaryAction = contactInfo.formUrl
    ? { href: contactInfo.formUrl, label: 'Napisz wiadomość', icon: ExternalLink, target: '_blank' as const }
    : contactInfo.email
    ? { href: `mailto:${contactInfo.email}`, label: 'Napisz wiadomość', icon: Mail, target: undefined }
    : null;

  return (
    <div className="mt-4 rounded-lg border bg-muted/50 p-4 space-y-3">
      <h4 className="font-medium text-sm">
        Chcesz sprawdzić, czy ten pomysł ma sens w Twoim przypadku?
      </h4>
      <p className="text-sm text-muted-foreground">
        Możemy omówić zakres, wykonalność i prostą wersję startową.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        {primaryAction && (
          <Button asChild size="sm">
            <a href={primaryAction.href} target={primaryAction.target} rel={primaryAction.target ? 'noopener noreferrer' : undefined}>
              <primaryAction.icon className="h-4 w-4 mr-2" />
              {primaryAction.label}
            </a>
          </Button>
        )}
        {contactInfo.phone && (
          <Button variant="outline" size="sm" asChild>
            <a href={`tel:${contactInfo.phone}`}>
              <Phone className="h-4 w-4 mr-2" />
              {contactInfo.phone}
            </a>
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground italic">
        To inspiracja, nie gotowa rekomendacja biznesowa.
      </p>
    </div>
  );
}
