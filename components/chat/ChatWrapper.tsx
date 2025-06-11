"use client";
import { useContext, useEffect } from "react";
import { Message } from "@/types/chat";
import { ChatContext } from "@/context/ChatContext";

interface ChatWrapperProps {
  initialMessages: Message[];
  initialConversationId: string;
  children: React.ReactNode;
}

export function ChatWrapper({
  initialMessages,
  initialConversationId,
  children,
}: ChatWrapperProps) {
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

  return <>{children}</>;
}
