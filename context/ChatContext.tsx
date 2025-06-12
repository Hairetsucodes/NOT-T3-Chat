"use client";
import {
  Conversation,
  PreferredModel,
  UserCustomization,
} from "@prisma/client";
import { createContext, useState, useCallback, useRef } from "react";
import { UnifiedModel } from "@/data/models";
import { getPreferredModels } from "@/data/models";
import { Message } from "@/types/chat";

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
};

interface ChatContextType {
  conversations: ConversationWithLoading[];
  setConversations: (conversations: ConversationWithLoading[]) => void;
  addConversation: (conversation: ConversationWithLoading) => void;
  updateConversation: (
    id: string,
    updates: Partial<ConversationWithLoading>
  ) => void;
  removeLoadingConversation: (id: string) => void;
  activeUser: ChatUser;
  userSettings: UserCustomization | null;
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
  selectedModel: {
    [key: string]: string;
  };
  setSelectedModel: (model: { [key: string]: string }) => void;
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
    options?: { conversationId?: string; selectedModel?: string }
  ) => Promise<void>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (event?: { preventDefault?: () => void }) => void;
  handleSuggestionSelect: (suggestion: string) => void;
}

export const ChatContext = createContext<ChatContextType>({
  conversations: [],
  setConversations: () => {},
  addConversation: () => {},
  updateConversation: () => {},
  removeLoadingConversation: () => {},
  activeUser: null,
  userSettings: null,
  setUserSettings: () => {},
  activeProviders: [],
  setActiveProviders: () => {},
  currentProvider: null,
  availableModels: [],
  preferredModels: [],
  setPreferredModels: () => {},
  refreshPreferredModels: async () => {},
  selectedModel: {},
  setSelectedModel: () => {},
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
  children: React.ReactNode;
}) => {
  const [conversations, setConversations] =
    useState<ConversationWithLoading[]>(initialConversations);
  const [preferredModels, setPreferredModels] = useState<PreferredModel[]>(
    initialPreferredModels
  );
  const [activeProviders, setActiveProviders] = useState<
    {
      id: string;
      provider: string;
    }[]
  >(initialActiveProviders);
  const [selectedModel, setSelectedModel] = useState<{
    [key: string]: string;
  }>({
    model: "gpt-4o-mini",
    provider: "openai",
  });

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

  const refreshPreferredModels = async () => {
    if (!activeUser?.id) return;

    try {
      const updated = await getPreferredModels(activeUser.id);
      setPreferredModels(updated);
    } catch (error) {
      console.error("Failed to refresh preferred models:", error);
    }
  };

  // New chat messaging functions
  const sendMessage = useCallback(
    async (
      message: Message,
      options?: { conversationId?: string; selectedModel?: string }
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
              provider: selectedModel.provider || "openai",
              model: selectedModel.model || "gpt-4o-mini",
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
        };

        setMessages([...newMessages, assistantMessage]);

        let done = false;
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
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [
      messages,
      conversationId,
      conversationTitle,
      selectedModel,
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
    (event?: { preventDefault?: () => void }) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }

      if (input.trim() && !isLoading) {
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
          };
          addConversation(loadingConversation);
        }

        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: input,
        };

        sendMessage(userMessage, {
          ...(conversationId && { conversationId }),
        });

        setInput("");
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

  return (
    <ChatContext.Provider
      value={{
        conversations,
        setConversations,
        addConversation,
        updateConversation,
        removeLoadingConversation,
        activeUser,
        userSettings,
        setUserSettings,
        activeProviders,
        setActiveProviders,
        currentProvider,
        availableModels,
        preferredModels,
        setPreferredModels,
        refreshPreferredModels,
        selectedModel,
        setSelectedModel,
        messages,
        setMessages,
        input,
        setInput,
        isLoading,
        conversationId,
        setConversationId,
        conversationTitle,
        setConversationTitle,
        sendMessage,
        handleInputChange,
        handleSubmit,
        handleSuggestionSelect,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
