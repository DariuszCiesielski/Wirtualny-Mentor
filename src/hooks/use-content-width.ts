'use client';

import { useState, useEffect } from 'react';

export type ContentWidth = 'narrow' | 'default' | 'wide';

const STORAGE_KEY = 'wm-content-width';

const WIDTH_CLASSES: Record<ContentWidth, string> = {
  narrow: 'max-w-2xl',
  default: 'max-w-4xl',
  wide: 'max-w-6xl',
};

export function useContentWidth() {
  const [width, setWidth] = useState<ContentWidth>('default');

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as ContentWidth | null;
    if (stored && stored in WIDTH_CLASSES) {
      setWidth(stored);
    }
  }, []);

  const setContentWidth = (newWidth: ContentWidth) => {
    setWidth(newWidth);
    localStorage.setItem(STORAGE_KEY, newWidth);
  };

  return {
    width,
    setContentWidth,
    widthClass: WIDTH_CLASSES[width],
  };
}
