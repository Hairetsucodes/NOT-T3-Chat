"use client";
import { Conversation } from "@prisma/client";
import { createContext, useState } from "react";

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
}

export const ChatContext = createContext<ChatContextType>({
  conversations: [],
  setConversations: () => {},
  activeUser: null,
});

export const ChatProvider = ({
  activeUser,
  initialConversations,
  children,
}: {
  activeUser: ChatUser;
  initialConversations: Conversation[];
  children: React.ReactNode;
}) => {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);

  return (
    <ChatContext.Provider
      value={{ conversations, setConversations, activeUser }}
    >
      {children}
    </ChatContext.Provider>
  );
};
