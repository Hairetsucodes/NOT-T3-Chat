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
  const { setMessages, setConversationId } = useContext(ChatContext);

  useEffect(() => {
    // Always load conversation data when initialConversationId changes
    // This ensures conversations load when navigating between them
    setMessages(initialMessages);
    setConversationId(initialConversationId);
  }, [initialConversationId, initialMessages, setMessages, setConversationId]);

  return <>{children}</>;
}
