"use client";
import {
  Conversation,
  PreferredModel,
  UserCustomization,
  ChatSettings,
} from "@prisma/client";
import { createContext } from "react";
import { UnifiedModel } from "@/types/models";
import {
  Message,
  ChatContextType,
  ChatUser,
} from "@/types/chat";
import { useChat } from "@/hooks/useChat";

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
  filteredModels: [],
  setFilteredModels: () => {},
  activeProviders: [],
  setActiveProviders: () => {},
  availableModels: [],
  setAvailableModels: () => {},
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
  initialConversations = [],
  initialActiveProviders = [],
  availableModels = [],
  preferredModels: initialPreferredModels = [],
  initialMessages,
  initialConversationId,
  needsClientSideLoading,
  initialUserSettings = null,
  initialChatSettings = null,
  children,
}: {
  activeUser: ChatUser;
  initialConversations?: Conversation[];
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
  children: React.ReactNode;
}) => {
  
  const chatHook = useChat({
    activeUser,
    initialConversations,
    initialActiveProviders,
    availableModels,
    preferredModels: initialPreferredModels,
    initialMessages,
    initialConversationId,
    needsClientSideLoading,
    initialUserSettings,
    initialChatSettings,
  });

  return (
    <ChatContext.Provider value={chatHook}>{children}</ChatContext.Provider>
  );
};

// Re-export the server provider for convenience
export { ChatServerProvider } from "./ChatServerProvider";
