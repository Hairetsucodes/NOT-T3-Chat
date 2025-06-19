import { useCallback, useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Message, ConversationWithLoading, ChatUser } from "@/types/chat";
import {
  ChatSettings,
  UserCustomization,
  PreferredModel,
} from "@prisma/client";
import { UnifiedModel } from "@/types/models";
import { useStreamingChat } from "./useStreamingChat";
import { useConversations } from "./useConversations";
import { useModelManagement } from "./useModelManagement";
import { useChatInput } from "./useChatInput";
import {
  transformDatabaseMessages,
  DatabaseMessage,
} from "@/lib/utils/message-transform";
import { reconnectToStream } from "@/lib/utils/reconnect";

interface UseChatOptions {
  activeUser: ChatUser;
  initialConversations?: ConversationWithLoading[];
  initialActiveProviders?: {
    id: string;
    provider: string;
  }[];
  availableModels?: UnifiedModel[];
  preferredModels?: PreferredModel[];
  initialMessages?: Message[];
  initialConversationId?: string;
  needsClientSideLoading?: string;
  initialUserSettings?: UserCustomization | null;
  initialChatSettings?: ChatSettings | null;
}

// Client-side wrapper for loading messages
const loadConversationMessages = async (
  conversationId: string
): Promise<Message[]> => {
  try {
    const response = await fetch(`/api/messages/${conversationId}`);
    if (!response.ok) {
      throw new Error(`Failed to load messages: ${response.status}`);
    }
    const dbMessages: DatabaseMessage[] = await response.json();
    return transformDatabaseMessages(dbMessages);
  } catch (error) {
    console.error("Error loading conversation messages:", error);
    return [];
  }
};

export const useChat = ({
  activeUser,
  initialConversations = [],
  initialActiveProviders = [],
  availableModels = [],
  preferredModels = [],
  initialMessages = [],
  initialConversationId,
  needsClientSideLoading,
  initialUserSettings = null,
  initialChatSettings = null,
}: UseChatOptions) => {
  const router = useRouter();

  // Core state
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [conversationId, setConversationIdState] = useState<string | null>(
    initialConversationId ?? null
  );
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    null
  );
  const [userSettings, setUserSettings] = useState<UserCustomization | null>(
    initialUserSettings
  );
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(
    initialChatSettings
  );

  const loadingConversationIdRef = useRef<string | null>(null);


  // Custom hooks
  const streamingHook = useStreamingChat();
  const conversationHook = useConversations(
    initialConversations,
    activeUser?.id
  );
  const modelHook = useModelManagement(
    availableModels,
    initialActiveProviders,
    preferredModels
  );

  // Message update handler for streaming
  const handleMessageUpdate = useCallback(
    (messageId: string, updates: Partial<Message>) => {
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, ...updates } : msg))
      );
    },
    []
  );

  const {
    conversations,
    updateConversation,
    removeLoadingConversation,
    addConversation,
  } = conversationHook;

  // Enhanced setConversationId with reconnection support and duplicate prevention
  const setConversationId = useCallback(
    async (
      newConversationId: string | null,
      options?: { skipMessageLoading?: boolean }
    ) => {
      // If no ID provided, just clear everything
      if (!newConversationId) {
        setConversationIdState(null);
        setMessages([]);
        setConversationTitle(null);
        return;
      }

    

      // Check if the conversation is still generating
      const conversation = conversations.find(
        (conv) => conv.id === newConversationId
      );

      // Set conversation state first
      setConversationIdState(newConversationId);
      setConversationTitle(conversation?.title || null);

      // Skip loading messages if explicitly requested (e.g., for retries)
      if (options?.skipMessageLoading) {
        setMessages([]);
        return;
      }

      if (conversation?.isGenerating) {
      

        try {
          // First check if there's an active streaming session
          const checkResponse = await fetch(
            `/api/chat/reconnect?conversationId=${newConversationId}`,
            {
              method: "HEAD",
            }
          );

          if (!checkResponse.ok && checkResponse.status === 404) {
            updateConversation(newConversationId, { isGenerating: false });

            // Just load messages normally since stream is complete
            try {
              const messages = await loadConversationMessages(
                newConversationId
              );
              setMessages(messages);
            } catch (error) {
              console.error(
                "Failed to load messages after stream completion:",
                error
              );
              setMessages([]);
            }
            return;
          }

          // Load existing messages first
          const existingMessages = await loadConversationMessages(
            newConversationId
          );

          // Create a placeholder assistant message for the ongoing stream
          const assistantMessageId = `assistant-reconnect-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;

          const assistantMessage: Message = {
            id: assistantMessageId,
            role: "assistant",
            content: "",
            reasoning_content: "",
            partial_image: "",
            image_generation_status: "",
            provider: "openai",
            model: chatSettings?.model || "gpt-4o-mini",
          };

          // Set messages with existing messages plus the placeholder
          setMessages([...existingMessages, assistantMessage]);

          // Use the proper reconnect utility
          let accumulatedContent = "";
          let accumulatedReasoning = "";

          await reconnectToStream({
            conversationId: newConversationId,
            onChunk: (content: string, reasoning?: string) => {

              if (content) {
                accumulatedContent += content;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, content: accumulatedContent }
                      : msg
                  )
                );
              }

              if (reasoning) {
                accumulatedReasoning += reasoning;

                setMessages((prev) =>
                  prev.map((msg) =>
                    msg.id === assistantMessageId
                      ? { ...msg, reasoning_content: accumulatedReasoning }
                      : msg
                  )
                );
              }
            },
            onComplete: (fullContent: string, fullReasoning: string) => {
              updateConversation(newConversationId, { isGenerating: false });

              // Ensure final content is set
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? {
                        ...msg,
                        content: fullContent,
                        reasoning_content: fullReasoning,
                      }
                    : msg
                )
              );
            },
            onError: (error: Error) => {
              console.error("❌ Reconnection failed:", error);
              updateConversation(newConversationId, { isGenerating: false });

              // Fall back to loading messages normally
              loadConversationMessages(newConversationId)
                .then((messages) => {
                  setMessages(messages);
                })
                .catch((loadError) => {
                  console.error(
                    "Failed to load messages in error fallback:",
                    loadError
                  );
                  setMessages([]);
                });
            },
          });
        } catch (error) {
          console.error("Error during reconnection:", error);
          updateConversation(newConversationId, { isGenerating: false });

          // Fall back to just loading existing messages
          try {
            const messages = await loadConversationMessages(newConversationId);
            setMessages(messages);
          } catch (loadError) {
            console.error("Failed to load messages for fallback:", loadError);
            setMessages([]);
          }
        }
      } else {
        // Regular conversation switch (not generating)
        // Load messages from database
        try {
          const messages = await loadConversationMessages(newConversationId);
          setMessages(messages);
        } catch (error) {
          console.error("Failed to load conversation messages:", error);
          setMessages([]);
        }
      }
    },
    [conversations, updateConversation]
  );

 
  
  useEffect(() => {
    if (needsClientSideLoading && !conversationId ) {
      setConversationId(needsClientSideLoading);
    }
  }, [needsClientSideLoading, conversationId]);

  const handleConversationCreated = useCallback(
    (newConversationId: string, title?: string) => {
      if (!conversationId) {
        setConversationIdState(newConversationId);

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
            isGenerating: true,
          };
          addConversation(newConversation);
        }
      }
      if (title && !conversationTitle) {
        setConversationTitle(title);
        // Use the new ID directly, as state update is async
        const anId = newConversationId || conversationId;
        if (anId) {
          updateConversation(anId, { title });
          if (!conversationId && newConversationId) {
            // Use pushState to update URL without triggering navigation
            // This preserves the streaming connection
            if (typeof window !== "undefined") {
              window.history.pushState(null, "", `/chat/${newConversationId}`);
            }
          }
        }
      }
    },
    [
      conversationId,
      conversationTitle,
      activeUser?.id,
      addConversation,
      updateConversation,
    ]
  );

  // Loading conversation creation handler
  const handleCreateLoadingConversation = useCallback(
    (loadingId: string) => {
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
          isGenerating: false,
        };
        addConversation(loadingConversation);
      }
    },
    [activeUser?.id, addConversation]
  );

  // Main send message function
  const sendMessage = useCallback(
    async (
      message: Message,
      options?: {
        conversationId?: string;
        selectedModel?: string;
        provider?: string;
        model?: string;
        retry?: boolean;
      }
    ) => {
      // Add user message to the messages array
      const newMessages = [...messages, message];
      if (!options?.retry) {
        setMessages(newMessages);
      } else {
        setMessages([message]);
      }

      // Get the conversation ID we'll be working with
      const targetConversationId = options?.conversationId || conversationId;

      let actualConversationId: string | undefined;

      try {
        // Set isGenerating to true for the current conversation
        if (targetConversationId) {
          updateConversation(targetConversationId, { isGenerating: true });
        }

        // Remove loading conversation if it exists
        if (loadingConversationIdRef.current) {
          removeLoadingConversation(loadingConversationIdRef.current);
          loadingConversationIdRef.current = null;
        }

        const streamingResult = await streamingHook.sendStreamingMessage(
          options?.retry ? [message] : newMessages,
          {
            ...options,
            chatSettings,
            onMessageUpdate: handleMessageUpdate,
            onConversationCreated: handleConversationCreated,
          }
        );

        actualConversationId = streamingResult.conversationId;

        // Ensure isGenerating is still true after streaming setup
        if (actualConversationId) {
          updateConversation(actualConversationId, { isGenerating: true });
        }

        // Add assistant message to messages
        setMessages(
          options?.retry
            ? [...[message], streamingResult.assistantMessage]
            : [...newMessages, streamingResult.assistantMessage]
        );

        // Wait for streaming to complete
        await streamingResult.streamPromise;

        // Set isGenerating to false when streaming completes
        // Use the actual conversation ID returned from the streaming hook
        if (actualConversationId) {
          updateConversation(actualConversationId, { isGenerating: false });
        }
      } catch (error) {
        console.error("Error sending message:", error);

        // Set isGenerating to false on error
        // Use the actual conversation ID if available, otherwise fall back to targetConversationId
        const errorConversationId =
          actualConversationId || targetConversationId;
        if (errorConversationId) {
          updateConversation(errorConversationId, { isGenerating: false });
        }

        // Remove loading conversation on error
        if (loadingConversationIdRef.current) {
          removeLoadingConversation(loadingConversationIdRef.current);
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
      conversationId,
      chatSettings,
      streamingHook,
      updateConversation,
      removeLoadingConversation,
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
          router.replace("/chat");
        },
      });
    },
    [conversationHook, conversationId, setConversationId, router]
  );

  return {
    // Messages and chat state
    messages,
    setMessages,
    isLoading: streamingHook.isLoading,
    conversationId,
    setConversationId, // This is now the enhanced version
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
