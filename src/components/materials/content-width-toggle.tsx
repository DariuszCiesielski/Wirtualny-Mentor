'use client';

import { cn } from '@/lib/utils';
import type { ContentWidth } from '@/hooks/use-content-width';

interface ContentWidthToggleProps {
  width: ContentWidth;
  onChange: (width: ContentWidth) => void;
}

const options: { value: ContentWidth; label: string }[] = [
  { value: 'narrow', label: 'Wąski' },
  { value: 'default', label: 'Standard' },
  { value: 'wide', label: 'Szeroki' },
  { value: 'full', label: 'Pełny' },
];

export function ContentWidthToggle({ width, onChange }: ContentWidthToggleProps) {
  return (
    <div className="inline-flex items-center rounded-lg border bg-muted p-0.5 gap-0.5">
      {options.map(({ value, label }) => (
        <button
          key={value}
          onClick={() => onChange(value)}
          className={cn(
            'px-2.5 py-1 text-xs rounded-md transition-colors',
            width === value
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
