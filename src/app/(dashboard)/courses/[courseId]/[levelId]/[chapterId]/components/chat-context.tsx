'use client';

/**
 * Chat Context
 *
 * Provides the askMentor callback to deeply nested components.
 * Used to connect ChapterLayoutWithChat's chat opening logic
 * with ContentRenderer's "Ask mentor" buttons.
 */

import { createContext, useContext } from 'react';

interface ChatContextValue {
  askMentor: (context: string) => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

export function ChatContextProvider({
  children,
  askMentor,
}: {
  children: React.ReactNode;
  askMentor: (context: string) => void;
}) {
  return (
    <ChatContext.Provider value={{ askMentor }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChatContext() {
  return useContext(ChatContext);
}
