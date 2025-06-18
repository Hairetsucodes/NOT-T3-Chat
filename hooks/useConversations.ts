import { useCallback, useMemo, useState } from "react";
import { ConversationWithLoading } from "@/types/chat";
import { pinConversation } from "@/data/convo";
import { deleteConversation as deleteConversationAction } from "@/data/history";

export const useConversations = (
  initialConversations: ConversationWithLoading[],
  activeUserId?: string | null
) => {
  const [conversations, setConversations] =
    useState<ConversationWithLoading[]>(initialConversations);

  const pinnedConversations = useMemo(
    () => conversations.filter((conv) => conv.isPinned),
    [conversations]
  );

  const unpinnedConversations = useMemo(
    () => conversations.filter((conv) => !conv.isPinned),
    [conversations]
  );

  const addConversation = useCallback(
    (conversation: ConversationWithLoading) => {
      setConversations((prev) => {
        // Check if conversation with same ID already exists
        const existingIndex = prev.findIndex(
          (conv) => conv.id === conversation.id
        );
        if (existingIndex !== -1) {
          // Update existing conversation instead of adding duplicate
          return prev.map((conv, index) =>
            index === existingIndex
              ? { ...conv, ...conversation, updatedAt: new Date() }
              : conv
          );
        }
        // Add new conversation if it doesn't exist
        return [conversation, ...prev];
      });
    },
    []
  );

  const updateConversation = useCallback(
    (id: string, updates: Partial<ConversationWithLoading>) => {
      if (updates.hasOwnProperty("isGenerating")) {
      }
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

  const togglePinConversation = useCallback(
    async (id: string) => {
      if (!activeUserId) return;

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
        throw error;
      }
    },
    [activeUserId]
  );

  const deleteConversation = useCallback(
    async (
      id: string,
      options?: {
        onNavigateAway?: () => void;
        isCurrentConversation?: boolean;
      }
    ) => {
      if (!activeUserId) return;

      // Store backup for potential revert
      const conversationToDelete = conversations.find((conv) => conv.id === id);
      if (!conversationToDelete) return;

      // Optimistically remove from UI
      setConversations((prev) => prev.filter((conv) => conv.id !== id));

      // If we're currently viewing this conversation, navigate away
      if (options?.isCurrentConversation) {
        options.onNavigateAway?.();
      }

      try {
        const result = await deleteConversationAction(id);

        if ("error" in result) {
          // Revert the optimistic update on error
          setConversations((prev) => [conversationToDelete, ...prev]);
          throw new Error(result.error);
        }
      } catch (error) {
        // Revert the optimistic update on error
        setConversations((prev) => [conversationToDelete, ...prev]);
        console.error("Error deleting conversation:", error);
        throw error; // Re-throw so caller can handle UI feedback
      }
    },
    [activeUserId, conversations]
  );

  return {
    conversations,
    pinnedConversations,
    unpinnedConversations,
    setConversations,
    addConversation,
    updateConversation,
    removeLoadingConversation,
    togglePinConversation,
    deleteConversation,
  };
};
