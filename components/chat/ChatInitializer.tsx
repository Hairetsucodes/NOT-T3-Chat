"use client";
import { useContext, useEffect } from "react";
import { Message } from "@/types/chat";
import { ChatContext } from "@/context/ChatContext";

interface ChatInitializerProps {
  initialMessages: Message[];
  initialConversationId: string;
}

export function ChatInitializer({
  initialMessages,
  initialConversationId,
}: ChatInitializerProps) {
  const { setMessages, setConversationId, conversationId } =
    useContext(ChatContext);

  useEffect(() => {
    // Only initialize if we're loading a different conversation or no conversation is loaded
    if (conversationId !== initialConversationId) {
      setMessages(initialMessages);
      setConversationId(initialConversationId);
    }
  }, [
    initialMessages,
    initialConversationId,
    conversationId,
    setMessages,
    setConversationId,
  ]);

  return null; // This component doesn't render anything
}
