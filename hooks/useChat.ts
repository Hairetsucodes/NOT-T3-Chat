import { useCallback, useRef, useState } from "react";
import { Message, ConversationWithLoading, ChatUser } from "@/types/chat";
import { ChatSettings, UserCustomization, PreferredModel } from "@prisma/client";
import { UnifiedModel } from "@/types/models";
import { useStreamingChat } from "./useStreamingChat";
import { useConversations } from "./useConversations";
import { useModelManagement } from "./useModelManagement";
import { useChatInput } from "./useChatInput";

interface UseChatOptions {
  activeUser: ChatUser;
  initialConversations: ConversationWithLoading[];
  initialActiveProviders: {
    id: string;
    provider: string;
  }[];
  availableModels: UnifiedModel[];
  preferredModels: PreferredModel[];
  initialMessages?: Message[];
  initialConversationId?: string;
  initialUserSettings: UserCustomization | null;
  initialChatSettings: ChatSettings | null;
}

export const useChat = ({
  activeUser,
  initialConversations,
  initialActiveProviders,
  availableModels,
  preferredModels,
  initialMessages = [],
  initialConversationId,
  initialUserSettings,
  initialChatSettings,
}: UseChatOptions) => {
  // Core state
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [conversationTitle, setConversationTitle] = useState<string | null>(null);
  const [userSettings, setUserSettings] = useState<UserCustomization | null>(
    initialUserSettings
  );
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(
    initialChatSettings
  );

  const loadingConversationIdRef = useRef<string | null>(null);

  // Custom hooks
  const streamingHook = useStreamingChat();
  const conversationHook = useConversations(initialConversations, activeUser?.id);
  const modelHook = useModelManagement(
    availableModels,
    initialActiveProviders,
    preferredModels
  );

  // Message update handler for streaming
  const handleMessageUpdate = useCallback((messageId: string, updates: Partial<Message>) => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, ...updates } : msg
      )
    );
  }, []);

  // Conversation creation handler
  const handleConversationCreated = useCallback((newConversationId: string, title?: string) => {
    if (!conversationId) {
      setConversationId(newConversationId);

      // Add new conversation to context immediately
      if (title && activeUser?.id) {
        const newConversation = {
          id: newConversationId,
          title,
          userId: activeUser.id,
          createdAt: new Date(),
          updatedAt: new Date(),
          branchedFromConvoId: null,
          branchedIds: null,
          isPinned: false,
          isRetry: false,
          isPublic: false,
        };
        conversationHook.addConversation(newConversation);
      }
    }

    if (title && !conversationTitle) {
      setConversationTitle(title);
      // Use the new ID directly, as state update is async
      const anId = newConversationId || conversationId;
      if (anId) {
        conversationHook.updateConversation(anId, { title });
        if (!conversationId && newConversationId) {
          window.history.pushState(null, "", `/chat/${newConversationId}`);
        }
      }
    }
  }, [conversationId, conversationTitle, activeUser?.id, conversationHook]);

  // Loading conversation creation handler
  const handleCreateLoadingConversation = useCallback((loadingId: string) => {
    if (activeUser?.id) {
      loadingConversationIdRef.current = loadingId;

      const loadingConversation = {
        id: loadingId,
        title: "New Chat...",
        userId: activeUser.id,
        createdAt: new Date(),
        updatedAt: new Date(),
        isLoading: true,
        branchedFromConvoId: null,
        branchedIds: null,
        isPinned: false,
        isRetry: false,
        isPublic: false,
      };
      conversationHook.addConversation(loadingConversation);
    }
  }, [activeUser?.id, conversationHook]);

  // Main send message function
  const sendMessage = useCallback(
    async (
      message: Message,
      options?: {
        conversationId?: string;
        selectedModel?: string;
        provider?: string;
        model?: string;
      }
    ) => {
      // Add user message to the messages array
      const newMessages = [...messages, message];
      setMessages(newMessages);

      try {
        // Remove loading conversation if it exists
        if (loadingConversationIdRef.current) {
          conversationHook.removeLoadingConversation(loadingConversationIdRef.current);
          loadingConversationIdRef.current = null;
        }

        const { assistantMessage, streamPromise } = await streamingHook.sendStreamingMessage(
          newMessages,
          {
            ...options,
            chatSettings,
            onMessageUpdate: handleMessageUpdate,
            onConversationCreated: handleConversationCreated,
          }
        );

        // Add assistant message to messages
        setMessages([...newMessages, assistantMessage]);

        // Wait for streaming to complete
        await streamPromise;
      } catch (error) {
        console.error("Error sending message:", error);

        // Remove loading conversation on error
        if (loadingConversationIdRef.current) {
          conversationHook.removeLoadingConversation(loadingConversationIdRef.current);
          loadingConversationIdRef.current = null;
        }

        // Add error message
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content:
            error instanceof Error
              ? error.message
              : "An unexpected error occurred.",
        };

        setMessages([...newMessages, errorMessage]);
      }
    },
    [
      messages,
      chatSettings,
      streamingHook,
      conversationHook,
      handleMessageUpdate,
      handleConversationCreated,
    ]
  );

  // Input handling
  const inputHook = useChatInput({
    onSendMessage: sendMessage,
    conversationId,
    isLoading: streamingHook.isLoading,
    activeUserId: activeUser?.id,
    onCreateLoadingConversation: handleCreateLoadingConversation,
  });

  // Enhanced delete conversation with navigation
  const deleteConversation = useCallback(
    async (id: string) => {
      await conversationHook.deleteConversation(id, {
        isCurrentConversation: conversationId === id,
        onNavigateAway: () => {
          setConversationId(null);
          setMessages([]);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", "/chat");
          }
        },
      });
    },
    [conversationHook, conversationId]
  );

  return {
    // Messages and chat state
    messages,
    setMessages,
    isLoading: streamingHook.isLoading,
    conversationId,
    setConversationId,
    conversationTitle,
    setConversationTitle,
    sendMessage,

    // Input handling
    ...inputHook,

    // Conversations
    ...conversationHook,
    deleteConversation, // Use enhanced version

    // Models and providers
    ...modelHook,

    // Settings
    userSettings,
    setUserSettings,
    chatSettings,
    setChatSettings,

    // User
    activeUser,
  };
}; 