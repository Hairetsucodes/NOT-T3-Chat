import { useCallback, useRef, useState } from "react";
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
  
  // Add ref to track ongoing reconnections
  const activeReconnectionsRef = useRef<Set<string>>(new Set());

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

  // Destructure needed properties to avoid dependency issues
  const {
    conversations,
    updateConversation,
    removeLoadingConversation,
    addConversation,
  } = conversationHook;

  // Enhanced setConversationId with reconnection support and duplicate prevention
  const setConversationId = useCallback(
    async (newConversationId: string | null) => {
      // If no ID provided, just clear everything
      if (!newConversationId) {
        setConversationIdState(null);
        setMessages([]);
        setConversationTitle(null);
        return;
      }

      // Prevent duplicate reconnections to the same conversation
      if (activeReconnectionsRef.current.has(newConversationId)) {
        console.log("🚫 Reconnection already in progress for:", newConversationId);
        return;
      }

      // Check if the conversation is still generating
      const conversation = conversations.find(
        (conv) => conv.id === newConversationId
      );

      console.log("🔍 Conversation found:", {
        id: newConversationId,
        title: conversation?.title,
        isGenerating: conversation?.isGenerating,
        exists: !!conversation,
      });

      // Set conversation state first
      setConversationIdState(newConversationId);
      setConversationTitle(conversation?.title || null);

      if (conversation?.isGenerating) {
        console.log(
          "🔄 Attempting to reconnect to generating conversation:",
          newConversationId
        );

        // Mark this conversation as having an active reconnection
        activeReconnectionsRef.current.add(newConversationId);

        try {
          // First check if there's an active streaming session
          const checkResponse = await fetch(
            `/api/chat/reconnect?conversationId=${newConversationId}`,
            {
              method: "HEAD", // Just check if it exists
            }
          );

          if (!checkResponse.ok && checkResponse.status === 404) {
            console.log(
              "⚠️ No active streaming session found, stream likely completed. Loading messages normally."
            );
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
          console.log(
            "📥 Loaded existing messages count:",
            existingMessages.length
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
            model: "gpt-4o-mini",
          };

          console.log(
            "🎯 Created placeholder assistant message with ID:",
            assistantMessageId
          );

          // Set messages with existing messages plus the placeholder
          setMessages([...existingMessages, assistantMessage]);

          // Use the proper reconnect utility
          let accumulatedContent = "";
          let accumulatedReasoning = "";
          let chunkCount = 0;

          console.log("🚀 Starting reconnectToStream...");

          await reconnectToStream({
            conversationId: newConversationId,
            onChunk: (content: string, reasoning?: string) => {
              chunkCount++;
              console.log(`📦 Chunk ${chunkCount} received:`, {
                contentLength: content?.length || 0,
                reasoningLength: reasoning?.length || 0,
                content:
                  content?.substring(0, 50) +
                  (content?.length > 50 ? "..." : ""),
              });

              if (content) {
                accumulatedContent += content;
                console.log(
                  "📝 Updated content length:",
                  accumulatedContent.length
                );
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
                console.log(
                  "🤔 Updated reasoning length:",
                  accumulatedReasoning.length
                );
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
              console.log(
                "✅ Reconnection completed for conversation:",
                newConversationId
              );
              console.log("📊 Final stats:", {
                contentLength: fullContent.length,
                reasoningLength: fullReasoning.length,
                totalChunks: chunkCount,
              });
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
              
              // Remove from active reconnections
              activeReconnectionsRef.current.delete(newConversationId);
            },
            onError: (error: Error) => {
              console.error("❌ Reconnection failed:", error);
              console.log("🔄 Falling back to normal message loading");
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
              
              // Remove from active reconnections
              activeReconnectionsRef.current.delete(newConversationId);
            },
          });

          console.log("🏁 reconnectToStream completed");
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
          
          // Remove from active reconnections
          activeReconnectionsRef.current.delete(newConversationId);
        }
      } else {
        // Regular conversation switch (not generating)
        // Load messages from database
        try {
          const messages = await loadConversationMessages(newConversationId);
          setMessages(messages);
        } catch (error) {
          console.error("Failed to load conversation messages:", error);
          setMessages([]); // Fall back to empty messages on error
        }
      }
    },
    [conversations, updateConversation]
  );

  // Conversation creation handler
  const handleConversationCreated = useCallback(
    (newConversationId: string, title?: string) => {
      if (!conversationId) {
        setConversationIdState(newConversationId);

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
            isGenerating: true, // Set to true when creating a new conversation during message sending
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
            window.history.pushState(null, "", `/chat/${newConversationId}`);
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
      }
    ) => {
      // Add user message to the messages array
      const newMessages = [...messages, message];
      setMessages(newMessages);

      // Get the conversation ID we'll be working with
      const targetConversationId = options?.conversationId || conversationId;

      let actualConversationId: string | undefined;

      try {
        // Set isGenerating to true for the current conversation
        if (targetConversationId) {
          console.log(
            "🚀 Setting isGenerating: true for conversation:",
            targetConversationId
          );
          updateConversation(targetConversationId, { isGenerating: true });
        }

        // Remove loading conversation if it exists
        if (loadingConversationIdRef.current) {
          removeLoadingConversation(loadingConversationIdRef.current);
          loadingConversationIdRef.current = null;
        }

        const streamingResult = await streamingHook.sendStreamingMessage(
          newMessages,
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
          console.log(
            "🔄 Re-confirming isGenerating: true for conversation:",
            actualConversationId
          );
          updateConversation(actualConversationId, { isGenerating: true });
        }

        // Add assistant message to messages
        setMessages([...newMessages, streamingResult.assistantMessage]);

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
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", "/chat");
          }
        },
      });
    },
    [conversationHook, conversationId, setConversationId]
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
