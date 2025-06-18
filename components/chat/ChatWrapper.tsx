"use client";
import { useContext, useEffect, useRef } from "react";
import { Message } from "@/types/chat";
import { ChatContext } from "@/context/ChatContext";
import { useSearchParams } from "next/navigation";
import { ChatSettings } from "@prisma/client";

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
    setChatSettings,
    chatSettings,
    conversations,
  } = useContext(ChatContext);

  const searchParams = useSearchParams();
  const hasRetriedRef = useRef(false);
  const lastConversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    // Only update if the conversation ID actually changed
    if (lastConversationIdRef.current !== initialConversationId) {
      console.log("🔄 ChatWrapper: Setting conversation", {
        from: lastConversationIdRef.current,
        to: initialConversationId,
      });
      
      // Check if the conversation is currently generating
      const conversation = conversations.find(
        (conv) => conv.id === initialConversationId
      );
      
      // Only reset messages if conversation is NOT generating
      // This prevents wiping streaming content when clicking from sidebar
      if (!conversation?.isGenerating) {
        console.log("📝 ChatWrapper: Setting initial messages (not generating)");
        setMessages(initialMessages);
      } else {
        console.log("⚠️ ChatWrapper: Skipping message reset - conversation is generating");
      }
      
      setConversationId(initialConversationId);
      lastConversationIdRef.current = initialConversationId;
    } else if (initialMessages.length > 0) {
      // Check if conversation is generating before updating messages
      const conversation = conversations.find(
        (conv) => conv.id === initialConversationId
      );
      
      // Only update messages if conversation is not generating
      if (!conversation?.isGenerating) {
        console.log("📝 ChatWrapper: Updating messages for same conversation (not generating)");
        setMessages(initialMessages);
      } else {
        console.log("⚠️ ChatWrapper: Skipping message update - conversation is generating");
      }
    }
  }, [initialConversationId, initialMessages, setMessages, setConversationId, conversations]);

  // Second useEffect: Handle retry logic (run only once per retry)
  useEffect(() => {
    const retryModel = searchParams.get("model");
    const retryProvider = searchParams.get("provider");
    const isRetry = searchParams.get("retry") === "true";
    const retryMessage = searchParams.get("message");

    // Guard conditions - exit early if not a retry scenario
    if (!isRetry || !retryMessage) return;
    if (hasRetriedRef.current) return;
    if (initialMessages.length > 0) return;

    console.log("🔄 ChatWrapper: Processing retry", {
      model: retryModel,
      provider: retryProvider,
      message: retryMessage?.substring(0, 50) + "...",
    });

    // Update chat settings if retry model/provider specified
    if (retryModel && retryProvider && chatSettings) {
      setChatSettings({
        ...chatSettings,
        model: retryModel,
        provider: retryProvider,
      } as ChatSettings);
    }

    // Create and send user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: retryMessage,
    };

    sendMessage(userMessage, {
      conversationId: initialConversationId,
      selectedModel: retryModel || initialModel,
      provider: retryProvider || initialProvider,
    });

    hasRetriedRef.current = true;
  }, [
    searchParams,
    sendMessage,
    setChatSettings,
    initialConversationId,
    initialMessages.length, // Use length instead of full array to avoid unnecessary re-runs
    initialProvider,
    initialModel,
    chatSettings, // Keep this but it should be stable
  ]);

  // Reset retry flag when conversation changes
  useEffect(() => {
    hasRetriedRef.current = false;
  }, [initialConversationId]);

  return <>{children}</>;
}
