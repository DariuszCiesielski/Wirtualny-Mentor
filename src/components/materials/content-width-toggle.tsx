'use client';

import { AlignLeft, AlignCenter, AlignJustify } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ContentWidth } from '@/hooks/use-content-width';

interface ContentWidthToggleProps {
  width: ContentWidth;
  onChange: (width: ContentWidth) => void;
}

const options: { value: ContentWidth; icon: typeof AlignLeft; label: string }[] = [
  { value: 'narrow', icon: AlignLeft, label: 'Wąski' },
  { value: 'default', icon: AlignCenter, label: 'Domyślny' },
  { value: 'wide', icon: AlignJustify, label: 'Szeroki' },
];

export function ContentWidthToggle({ width, onChange }: ContentWidthToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
      {options.map(({ value, icon: Icon, label }) => (
        <Button
          key={value}
          variant="ghost"
          size="sm"
          onClick={() => onChange(value)}
          className={cn(
            'h-7 w-7 p-0',
            width === value && 'bg-background shadow-sm'
          )}
          title={label}
        >
          <Icon className="h-3.5 w-3.5" />
        </Button>
      ))}
    </div>
  );
}
