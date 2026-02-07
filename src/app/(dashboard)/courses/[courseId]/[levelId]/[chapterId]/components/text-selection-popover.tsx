'use client';

/**
 * Text Selection Popover
 *
 * Floating button that appears when text is selected in lesson content.
 * Allows user to ask the mentor about the selected text.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TextSelectionPopoverProps {
  /** Container ref to listen for text selection events */
  containerRef: React.RefObject<HTMLElement | null>;
  /** Callback with selected text when user clicks "Ask mentor" */
  onAskAboutSelection: (selectedText: string) => void;
}

export function TextSelectionPopover({
  containerRef,
  onAskAboutSelection,
}: TextSelectionPopoverProps) {
  const [position, setPosition] = useState<{ x: number; y: number } | null>(
    null
  );
  const [selectedText, setSelectedText] = useState('');
  const popoverRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed || !selection.toString().trim()) {
      // Delay hiding to allow click on popover
      setTimeout(() => {
        const active = document.activeElement;
        if (!popoverRef.current?.contains(active)) {
          setPosition(null);
          setSelectedText('');
        }
      }, 200);
      return;
    }

    const text = selection.toString().trim();
    if (text.length < 3) return;

    // Check if selection is within the container
    const container = containerRef.current;
    if (!container) return;

    const range = selection.getRangeAt(0);
    if (!container.contains(range.commonAncestorContainer)) return;

    // Position the popover near the selection
    const rect = range.getBoundingClientRect();
    const containerRect = container.getBoundingClientRect();

    setPosition({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top - 8,
    });
    setSelectedText(text);
  }, [containerRef]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    container.addEventListener('mouseup', handleMouseUp);
    return () => {
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [containerRef, handleMouseUp]);

  const handleClick = () => {
    if (selectedText) {
      // Format as quoted text
      const quoted = `Wyjaśnij ten fragment:\n\n> ${selectedText.slice(0, 500)}${selectedText.length > 500 ? '...' : ''}\n\n`;
      onAskAboutSelection(quoted);
      setPosition(null);
      setSelectedText('');
      window.getSelection()?.removeAllRanges();
    }
  };

  if (!position || !selectedText) return null;

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 animate-in fade-in-0 zoom-in-95"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: 'translate(-50%, -100%)',
      }}
    >
      <Button
        size="sm"
        className="h-8 gap-1.5 text-xs shadow-lg"
        onClick={handleClick}
      >
        <MessageCircle className="h-3.5 w-3.5" />
        Zapytaj mentora
      </Button>
    </div>
  );
}
