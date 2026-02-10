'use client';

import { ContentContainer } from '@/components/layout/content-container';

interface ChapterPageWrapperProps {
  children: React.ReactNode;
}

export function ChapterPageWrapper({ children }: ChapterPageWrapperProps) {
  return <ContentContainer className="py-8">{children}</ContentContainer>;
}
