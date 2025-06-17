import { useCallback, useState } from "react";
import { Message } from "@/types/chat";

interface UseChatInputOptions {
  onSendMessage: (message: Message, options?: { conversationId?: string }) => Promise<void>;
  conversationId: string | null;
  isLoading: boolean;
  activeUserId?: string | null;
  onCreateLoadingConversation?: (loadingId: string) => void;
}

export const useChatInput = ({
  onSendMessage,
  conversationId,
  isLoading,
  activeUserId,
  onCreateLoadingConversation,
}: UseChatInputOptions) => {
  const [input, setInput] = useState("");

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setInput(e.target.value);
    },
    []
  );

  const createLoadingConversation = useCallback(() => {
    if (!conversationId && activeUserId) {
      const loadingId = window.location.pathname.startsWith("/chat/")
        ? window.location.pathname.substring(6)
        : `loading-${Date.now()}-${Math.random()
            .toString(36)
            .substr(2, 9)}`;
      
      onCreateLoadingConversation?.(loadingId);
      return loadingId;
    }
    return null;
  }, [conversationId, activeUserId, onCreateLoadingConversation]);

  const handleSubmit = useCallback(
    (event?: { preventDefault?: () => void; currentInput?: string }) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }

      // Use currentInput if provided, otherwise fall back to input state
      const inputToUse = event?.currentInput ?? input;

      if (inputToUse.trim() && !isLoading) {
        // Add loading conversation for new chats
        createLoadingConversation();

        const userMessage: Message = {
          id: Date.now().toString(),
          role: "user",
          content: inputToUse,
        };

        onSendMessage(userMessage, {
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
      onSendMessage,
      createLoadingConversation,
    ]
  );

  const handleSuggestionSelect = useCallback(
    (suggestion: string) => {
      // Add loading conversation for new chats
      createLoadingConversation();

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: suggestion,
      };

      onSendMessage(userMessage, {
        ...(conversationId && { conversationId }),
      });
    },
    [conversationId, onSendMessage, createLoadingConversation]
  );

  return {
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    handleSuggestionSelect,
  };
}; 