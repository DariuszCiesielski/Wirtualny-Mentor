'use client';

import { useEffect, useState } from 'react';

/**
 * SSR-safe media query hook
 *
 * Returns false during SSR to avoid hydration mismatch.
 * Updates reactively when viewport changes.
 *
 * @param query - CSS media query string (e.g., '(min-width: 1024px)')
 * @returns boolean indicating if query matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);

    // Set initial value
    if (media.matches !== matches) {
      setMatches(media.matches);
    }

    // Listen for changes
    const listener = () => setMatches(media.matches);
    media.addEventListener('change', listener);

    return () => media.removeEventListener('change', listener);
  }, [matches, query]);

  return matches;
}
