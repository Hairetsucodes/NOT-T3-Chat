"use client";
import { useContext, useEffect, useRef } from "react";
import { ChatContext } from "@/context/ChatContext";

interface NewChatWrapperProps {
  children: React.ReactNode;
}

export function NewChatWrapper({ children }: NewChatWrapperProps) {
  const { conversationId, setConversationId, setMessages, setConversationTitle } = useContext(ChatContext);
  const hasInitialized = useRef(false);

  useEffect(() => {
    // Only clear state on initial mount, not when conversation is created
    if (!hasInitialized.current && !conversationId) {
      setConversationId(null);
      setMessages([]);
      setConversationTitle(null);
      hasInitialized.current = true;
    }
  }, [conversationId, setConversationId, setMessages, setConversationTitle]);

  return <>{children}</>;
} 