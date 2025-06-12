"use client";
import { useContext, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { ChatContext } from "@/context/ChatContext";
import { useSearchParams } from "next/navigation";

interface ChatWrapperProps {
  initialMessages: Message[];
  initialConversationId: string;
  initialProvider: string;
  initialModel: string;
  children: React.ReactNode;
}

export function ChatWrapper({
  initialMessages,
  initialConversationId,
  initialProvider,
  initialModel,
  children,
}: ChatWrapperProps) {
  const {
    setMessages,
    setConversationId,
    sendMessage,
    setSelectedModel,
    messages,
    selectedModel,
  } = useContext(ChatContext);

  const searchParams = useSearchParams();
  const hasRetriedRef = useRef(false);

  useEffect(() => {
    // Always load conversation data when initialConversationId changes
    // This ensures conversations load when navigating between them
    setMessages(initialMessages);
    setConversationId(initialConversationId);
  }, [initialConversationId, initialMessages, setMessages, setConversationId]);

  useEffect(() => {
    const retryModel = searchParams.get("model");
    const retryProvider = searchParams.get("provider");
    console.log("retryModel", retryModel);
    console.log("retryProvider", retryProvider);
    if (initialMessages.length > 0) return;
    if (hasRetriedRef.current) return;

    const isRetry = searchParams.get("retry") === "true";
    const retryMessage = searchParams.get("message");

    if (!isRetry || !retryMessage) return;

    // Prevent duplicate retries if messages already exist
    if (messages.length > 0) return;

    // Update selected model/provider when provided in query
    if (retryModel && retryProvider) {
      setSelectedModel({ model: retryModel, provider: retryProvider });
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: retryMessage,
    };

    // Fire off the retry request
    sendMessage(userMessage, {
      conversationId: initialConversationId,
      selectedModel: initialModel || selectedModel.model,
      provider: initialProvider || selectedModel.provider,
    });

    hasRetriedRef.current = true;
  }, [
    searchParams,
    messages,
    sendMessage,
    setSelectedModel,
    initialConversationId,
    selectedModel,
    initialMessages,
    initialProvider,
    initialModel,
  ]);

  return <>{children}</>;
}
