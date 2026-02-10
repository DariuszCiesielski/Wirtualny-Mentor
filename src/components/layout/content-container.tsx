'use client';

import { useContentWidth } from '@/hooks/use-content-width';
import { ContentWidthToggle } from '@/components/materials/content-width-toggle';
import { cn } from '@/lib/utils';

interface ContentContainerProps {
  children: React.ReactNode;
  className?: string;
}

export function ContentContainer({ children, className }: ContentContainerProps) {
  const { width, setContentWidth, widthClass } = useContentWidth();

  return (
    <div className={cn('container transition-all duration-300', widthClass, className)}>
      <div className="flex justify-end mb-4">
        <ContentWidthToggle width={width} onChange={setContentWidth} />
      </div>
      {children}
    </div>
  );
}
