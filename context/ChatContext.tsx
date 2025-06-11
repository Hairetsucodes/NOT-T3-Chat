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

interface ChatContextType {
  conversations: Conversation[];
  setConversations: (conversations: Conversation[]) => void;
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
    useState<Conversation[]>(initialConversations);
  const [preferredModels, setPreferredModels] =
    useState<PreferredModel[]>(initialPreferredModels);

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
