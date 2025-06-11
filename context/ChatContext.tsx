"use client";
import { Conversation, PreferredModel } from "@prisma/client";
import { createContext, useState } from "react";
import { UnifiedModel } from "@/data/models";
import { getPreferredModels } from "@/data/models";

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
  updateConversation: (id: string, updates: Partial<ConversationWithLoading>) => void;
  removeLoadingConversation: (id: string) => void;
  activeUser: ChatUser;
  activeProviders: string[];
  currentProvider: string | null;
  availableModels: UnifiedModel[];
  preferredModels: PreferredModel[];
  setPreferredModels: (models: PreferredModel[]) => void;
  refreshPreferredModels: () => Promise<void>;
}

export const ChatContext = createContext<ChatContextType>({
  conversations: [],
  setConversations: () => {},
  addConversation: () => {},
  updateConversation: () => {},
  removeLoadingConversation: () => {},
  activeUser: null,
  activeProviders: [],
  currentProvider: null,
  availableModels: [],
  preferredModels: [],
  setPreferredModels: () => {},
  refreshPreferredModels: async () => {},
});

export const ChatProvider = ({
  activeUser,
  initialConversations,
  activeProviders,
  currentProvider,
  availableModels,
  preferredModels: initialPreferredModels,
  children,
}: {
  activeUser: ChatUser;
  initialConversations: Conversation[];
  activeProviders: string[];
  currentProvider: string | null;
  availableModels: UnifiedModel[];
  preferredModels: PreferredModel[];
  children: React.ReactNode;
}) => {
  const [conversations, setConversations] =
    useState<ConversationWithLoading[]>(initialConversations);
  const [preferredModels, setPreferredModels] =
    useState<PreferredModel[]>(initialPreferredModels);

  const addConversation = (conversation: ConversationWithLoading) => {
    setConversations(prev => [conversation, ...prev]);
  };

  const updateConversation = (id: string, updates: Partial<ConversationWithLoading>) => {
    setConversations(prev => 
      prev.map(conv => 
        conv.id === id 
          ? { ...conv, ...updates, updatedAt: new Date() }
          : conv
      )
    );
  };

  const removeLoadingConversation = (id: string) => {
    setConversations(prev => prev.filter(conv => conv.id !== id));
  };

  const refreshPreferredModels = async () => {
    if (!activeUser?.id) return;
    
    try {
      const updated = await getPreferredModels(activeUser.id);
      setPreferredModels(updated);
    } catch (error) {
      console.error("Failed to refresh preferred models:", error);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        conversations,
        setConversations,
        addConversation,
        updateConversation,
        removeLoadingConversation,
        activeUser,
        activeProviders,
        currentProvider,
        availableModels,
        preferredModels,
        setPreferredModels,
        refreshPreferredModels,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};
