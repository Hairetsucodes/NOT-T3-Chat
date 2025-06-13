"use client";
import {
  Conversation,
  PreferredModel,
  UserCustomization,
  ChatSettings,
} from "@prisma/client";
import { createContext, useState, useCallback, useRef, useMemo } from "react";
import { UnifiedModel } from "@/data/models";
import { getPreferredModels } from "@/data/models";
import { Message } from "@/types/chat";
import { pinConversation } from "@/data/convo";
import { deleteConversation as deleteConversationAction } from "@/data/history";

type ChatUser = {
  name: string | null;
  id: string;
  username: string | null;
  email: string | null;
  image: string | null;
} | null;

// Extend Conversation type to include loading state
type ConversationWithLoading = Conversation & {
  isLoading?: boolean;
  isRetry?: boolean;
};

interface ChatContextType {
  conversations: ConversationWithLoading[];
  pinnedConversations: ConversationWithLoading[];
  unpinnedConversations: ConversationWithLoading[];
  setConversations: (conversations: ConversationWithLoading[]) => void;
  addConversation: (conversation: ConversationWithLoading) => void;
  updateConversation: (
    id: string,
    updates: Partial<ConversationWithLoading>
  ) => void;
  removeLoadingConversation: (id: string) => void;
  togglePinConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  activeUser: ChatUser;
  userSettings: UserCustomization | null;
  chatSettings: ChatSettings | null;
  setChatSettings: (settings: ChatSettings) => void;
  setUserSettings: (settings: UserCustomization) => void;
  activeProviders: {
    id: string;
    provider: string;
  }[];
  setActiveProviders: (
    providers: {
      id: string;
      provider: string;
    }[]
  ) => void;
  currentProvider: string | null;
  availableModels: UnifiedModel[];
  preferredModels: PreferredModel[];
  setPreferredModels: (models: PreferredModel[]) => void;
  refreshPreferredModels: () => Promise<void>;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  conversationTitle: string | null;
  setConversationTitle: (title: string | null) => void;
  sendMessage: (
    message: Message,
    options?: {
      conversationId?: string;
      selectedModel?: string;
      provider?: string;
      model?: string;
    }
  ) => Promise<void>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (event?: {
    preventDefault?: () => void;
    currentInput?: string;
  }) => void;
  handleSuggestionSelect: (suggestion: string) => void;
}

export const ChatContext = createContext<ChatContextType>({
  conversations: [],
  pinnedConversations: [],
  unpinnedConversations: [],
  setConversations: () => {},
  addConversation: () => {},
  updateConversation: () => {},
  removeLoadingConversation: () => {},
  togglePinConversation: () => Promise.resolve(),
  deleteConversation: () => Promise.resolve(),
  activeUser: null,
  userSettings: null,
  chatSettings: null,
  setChatSettings: () => {},
  setUserSettings: () => {},
  activeProviders: [],
  setActiveProviders: () => {},
  currentProvider: null,
  availableModels: [],
  preferredModels: [],
  setPreferredModels: () => {},
  refreshPreferredModels: async () => {},
  messages: [],
  setMessages: () => {},
  input: "",
  setInput: () => {},
  isLoading: false,
  conversationId: null,
  setConversationId: () => {},
  conversationTitle: null,
  setConversationTitle: () => {},
  sendMessage: async () => {},
  handleInputChange: () => {},
  handleSubmit: () => {},
  handleSuggestionSelect: () => {},
});

export const ChatProvider = ({
  activeUser,
  initialConversations,
  initialActiveProviders,
  currentProvider,
  availableModels,
  preferredModels: initialPreferredModels,
  initialMessages,
  initialConversationId,
  initialUserSettings,
  initialChatSettings,
  children,
}: {
  activeUser: ChatUser;
  initialConversations: Conversation[];
  initialActiveProviders: {
    id: string;
    provider: string;
  }[];
  currentProvider: string | null;
  availableModels: UnifiedModel[];
  preferredModels: PreferredModel[];
  initialMessages?: Message[];
  initialConversationId?: string;
  initialUserSettings: UserCustomization | null;
  initialChatSettings: ChatSettings | null;
  children: React.ReactNode;
}) => {
  const [conversations, setConversations] =
    useState<ConversationWithLoading[]>(initialConversations);

  // Derived state for pinned and unpinned conversations
  const pinnedConversations = conversations.filter((conv) => conv.isPinned);
  const unpinnedConversations = conversations.filter((conv) => !conv.isPinned);

  const [preferredModels, setPreferredModels] = useState<PreferredModel[]>(
    initialPreferredModels
  );
  const [activeProviders, setActiveProviders] = useState<
    {
      id: string;
      provider: string;
    }[]
  >(initialActiveProviders);
  const [chatSettings, setChatSettings] = useState<ChatSettings | null>(
    initialChatSettings
  );
  // New chat messaging state
  const [messages, setMessages] = useState<Message[]>(initialMessages || []);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [userSettings, setUserSettings] = useState<UserCustomization | null>(
    initialUserSettings
  );
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    null
  );

  const loadingConversationIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const addConversation = useCallback(
    (conversation: ConversationWithLoading) => {
      setConversations((prev) => [conversation, ...prev]);
    },
    []
  );

  const updateConversation = useCallback(
    (id: string, updates: Partial<ConversationWithLoading>) => {
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === id ? { ...conv, ...updates, updatedAt: new Date() } : conv
        )
      );
    },
    []
  );

  const removeLoadingConversation = useCallback((id: string) => {
    setConversations((prev) => prev.filter((conv) => conv.id !== id));
  }, []);

  const refreshPreferredModels = useCallback(async () => {
    try {
      const updated = await getPreferredModels();
      setPreferredModels(updated);
    } catch (error) {
      console.error("Failed to refresh preferred models:", error);
    }
  }, []);

  // New chat messaging functions
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
      setIsLoading(true);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages: newMessages,
            ...(options?.conversationId && {
              conversationId: options.conversationId,
            }),
            selectedModel: {
              provider: options?.provider || chatSettings?.provider || "openai",
              model: options?.model || chatSettings?.model || "gpt-4o-mini",
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`
          );
        }

        // Remove loading conversation if it exists
        if (loadingConversationIdRef.current) {
          removeLoadingConversation(loadingConversationIdRef.current);
          loadingConversationIdRef.current = null;
        }

        // Handle conversation ID and title from response headers
        const generatedTitle = response.headers.get("X-Generated-Title");
        const responseConversationId =
          response.headers.get("X-Conversation-Id");

        if (responseConversationId && !conversationId) {
          setConversationId(responseConversationId);

          // Add new conversation to context immediately
          if (generatedTitle && activeUser?.id) {
            const newConversation = {
              id: responseConversationId,
              title: generatedTitle,
              userId: activeUser.id,
              createdAt: new Date(),
              updatedAt: new Date(),
              branchedFromConvoId: null,
              branchedIds: null,
              isPinned: false,
              isRetry: false,
            };
            addConversation(newConversation);
          }
        }

        if (generatedTitle && !conversationTitle) {
          setConversationTitle(generatedTitle);

          // Update existing conversation title if we have the ID
          if (conversationId) {
            updateConversation(conversationId, { title: generatedTitle });
          }
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body reader available");
        }

        // Create assistant message placeholder
        const assistantMessage: Message = {
          id: Date.now().toString(),
          role: "assistant",
          content: "",
          reasoning_content: "",
          provider: options?.provider || chatSettings?.provider || "openai",
          model: options?.model || chatSettings?.model || "gpt-4o-mini",
        };

        setMessages([...newMessages, assistantMessage]);

        let done = false;
        let hasReceivedFirstToken = false; // Track if we've received the first content token

        while (!done) {
          const { value, done: streamDone } = await reader.read();
          done = streamDone;

          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split("\n");

            for (const line of lines) {
              if (line.startsWith("data: ")) {
                const data = line.slice(6);

                try {
                  const parsed = JSON.parse(data);
                  if (parsed.content) {
                    // Stop loading animation as soon as first content token arrives
                    if (!hasReceivedFirstToken) {
                      setIsLoading(false);
                      hasReceivedFirstToken = true;
                    }

                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? { ...msg, content: msg.content + parsed.content }
                          : msg
                      )
                    );
                  }
                  if (parsed.reasoning) {
                    setMessages((prev) =>
                      prev.map((msg) =>
                        msg.id === assistantMessage.id
                          ? {
                              ...msg,
                              reasoning_content:
                                (msg.reasoning_content || "") +
                                parsed.reasoning,
                            }
                          : msg
                      )
                    );
                  }
                } catch {
                  // Skip invalid JSON chunks
                }
              }
            }
          }
        }
      } catch (error) {
        console.error("Error sending message:", error);

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
      } finally {
        // Ensure loading is always set to false when done
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      messages,
      conversationId,
      conversationTitle,
      chatSettings,
      addConversation,
      updateConversation,
      removeLoadingConversation,
      activeUser?.id,
    ]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const handleSubmit = useCallback(
    (event?: { preventDefault?: () => void; currentInput?: string }) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }

      // Use currentInput if provided, otherwise fall back to input state
      const inputToUse = event?.currentInput ?? input;

      if (inputToUse.trim() && !isLoading) {
        // Add loading conversation for new chats
        if (!conversationId && activeUser?.id) {
          const loadingId = `loading-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
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
          };
          addConversation(loadingConversation);
        }

        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: inputToUse,
        };

        sendMessage(userMessage, {
          ...(conversationId && { conversationId }),
        });

        // Only clear input state if we used it (not currentInput)
        if (!event?.currentInput) {
          setInput("");
        }
      }
    },
    [
      input,
      isLoading,
      conversationId,
      sendMessage,
      addConversation,
      activeUser?.id,
    ]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      // Add loading conversation for new chats
      if (!conversationId && activeUser?.id) {
        const loadingId = `loading-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
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
        };
        addConversation(loadingConversation);
      }

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: suggestion,
      };

      sendMessage(userMessage, {
        ...(conversationId && { conversationId }),
      });
    },
    [conversationId, sendMessage, addConversation, activeUser?.id]
  );

  const togglePinConversation = useCallback(
    async (id: string) => {
      if (!activeUser?.id) return;

      // Optimistically update the UI
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === id
            ? { ...conv, isPinned: !conv.isPinned, updatedAt: new Date() }
            : conv
        )
      );

      // Update on the server using the server action
      try {
        await pinConversation(id);
      } catch (error) {
        // Revert on error
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === id
              ? { ...conv, isPinned: !conv.isPinned, updatedAt: new Date() }
              : conv
          )
        );
        console.error("Error toggling pin status:", error);
      }
    },
    [activeUser?.id]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      if (!activeUser?.id) return;

      // Store backup for potential revert
      const conversationToDelete = conversations.find((conv) => conv.id === id);
      if (!conversationToDelete) return;

      // Optimistically remove from UI
      setConversations((prev) => prev.filter((conv) => conv.id !== id));

      // If we're currently viewing this conversation, navigate away
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
        if (typeof window !== "undefined") {
          window.history.replaceState(null, "", "/chat");
        }
      }

      try {
        const result = await deleteConversationAction(id);

        if ("error" in result) {
          // Revert the optimistic update on error
          setConversations((prev) => [conversationToDelete, ...prev]);

          // Restore conversation view if it was the current one
          if (conversationId === id) {
            setConversationId(id);
            if (typeof window !== "undefined") {
              window.history.replaceState(null, "", `/chat/${id}`);
            }
          }

          throw new Error(result.error);
        }
      } catch (error) {
        // Revert the optimistic update on error
        setConversations((prev) => [conversationToDelete, ...prev]);

        // Restore conversation view if it was the current one
        if (conversationId === id) {
          setConversationId(id);
          if (typeof window !== "undefined") {
            window.history.replaceState(null, "", `/chat/${id}`);
          }
        }

        console.error("Error deleting conversation:", error);
        throw error; // Re-throw so caller can handle UI feedback
      }
    },
    [
      activeUser?.id,
      conversations,
      conversationId,
      setConversationId,
      setMessages,
    ]
  );

  // Split context into static and dynamic parts to reduce re-renders
  const staticContextValue = useMemo(
    () => ({
      conversations,
      pinnedConversations,
      unpinnedConversations,
      setConversations,
      addConversation,
      updateConversation,
      removeLoadingConversation,
      togglePinConversation,
      deleteConversation,
      activeUser,
      userSettings,
      chatSettings,
      setChatSettings,
      setUserSettings,
      activeProviders,
      setActiveProviders,
      currentProvider,
      availableModels,
      preferredModels,
      setPreferredModels,
      refreshPreferredModels,
      conversationId,
      setConversationId,
      conversationTitle,
      setConversationTitle,
      handleInputChange,
      handleSubmit,
      handleSuggestionSelect,
      sendMessage,
    }),
    [
      conversations,
      pinnedConversations,
      unpinnedConversations,
      setConversations,
      addConversation,
      updateConversation,
      removeLoadingConversation,
      togglePinConversation,
      deleteConversation,
      activeUser,
      userSettings,
      chatSettings,
      setChatSettings,
      setUserSettings,
      activeProviders,
      setActiveProviders,
      currentProvider,
      availableModels,
      preferredModels,
      setPreferredModels,
      refreshPreferredModels,
      conversationId,
      setConversationId,
      conversationTitle,
      setConversationTitle,
      handleInputChange,
      handleSubmit,
      handleSuggestionSelect,
      sendMessage,
    ]
  );

  // Separate dynamic streaming data to minimize re-renders
  const streamingContextValue = useMemo(
    () => ({
      messages,
      setMessages,
      input,
      setInput,
      isLoading,
    }),
    [messages, setMessages, input, setInput, isLoading]
  );

  // Combine the contexts
  const contextValue = useMemo(
    () => ({
      ...staticContextValue,
      ...streamingContextValue,
    }),
    [staticContextValue, streamingContextValue]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};
