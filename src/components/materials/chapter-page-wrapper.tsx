'use client';

import { useContentWidth } from '@/hooks/use-content-width';
import { ContentWidthToggle } from './content-width-toggle';
import { cn } from '@/lib/utils';

interface ChapterPageWrapperProps {
  children: React.ReactNode;
}

export function ChapterPageWrapper({ children }: ChapterPageWrapperProps) {
  const { width, setContentWidth, widthClass } = useContentWidth();

  return (
    <div className={cn('container py-8 transition-all duration-300', widthClass)}>
      <div className="flex justify-end mb-4">
        <ContentWidthToggle width={width} onChange={setContentWidth} />
      </div>
      {children}
    </div>
  );
}
