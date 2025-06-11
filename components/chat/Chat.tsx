"use client";
import { Message, useChat } from "@ai-sdk/react";
import { Sidebar } from "./Sidebar";
import { ChatContainer } from "./Container";
import { useContext, useState, useRef } from "react";
import { useCallback } from "react";
import { ChatContext } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export const Chat = ({
  messages: initialMessages,
  conversationId: initialConversationId,
}: {
  messages?: Message[];
  conversationId?: string;
}) => {
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId ?? null
  );
  const [conversationTitle, setConversationTitle] = useState<string | null>(
    null
  );
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const loadingConversationIdRef = useRef<string | null>(null);
  const {
    conversations,
    addConversation,
    updateConversation,
    removeLoadingConversation,
    activeUser,
  } = useContext(ChatContext);

  const { messages, setMessages, input, handleInputChange, append, setInput } =
    useChat({
      // Initialize with existing messages
      initialMessages: initialMessages || [],
      // Optimize for faster streaming
      keepLastMessageOnError: true,
      // Handle response to extract conversation ID and title
      onResponse: useCallback(
        (response: Response) => {
          const newConversationId = response.headers.get("X-Conversation-Id");
          const generatedTitle = response.headers.get("X-Generated-Title");

          // Remove loading conversation if it exists
          if (loadingConversationIdRef.current) {
            removeLoadingConversation(loadingConversationIdRef.current);
            loadingConversationIdRef.current = null;
          }

          if (newConversationId && !conversationId) {
            setConversationId(newConversationId);

            // Add new conversation to context immediately
            if (generatedTitle && activeUser?.id) {
              const newConversation = {
                id: newConversationId,
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
        },
        [
          conversationId,
          conversationTitle,
          addConversation,
          updateConversation,
          removeLoadingConversation,
          activeUser?.id,
        ]
      ),
      // Handle errors - remove loading conversation if API fails
      onError: useCallback(() => {
        if (loadingConversationIdRef.current) {
          removeLoadingConversation(loadingConversationIdRef.current);
          loadingConversationIdRef.current = null;
        }
      }, [removeLoadingConversation]),
    });

  // Custom handleSubmit that includes conversationId
  const handleSubmit = useCallback(
    (event?: { preventDefault?: () => void }) => {
      if (event?.preventDefault) {
        event.preventDefault();
      }

      if (input.trim()) {
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

        append(
          {
            role: "user",
            content: input,
          },
          {
            body: conversationId ? { conversationId } : {},
          }
        );
        setInput("");
      }
    },
    [input, conversationId, append, setInput, addConversation, activeUser?.id]
  );

  // Handle suggestion selection from welcome screen
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

      // Submit the suggestion immediately
      append(
        {
          role: "user",
          content: suggestion,
        },
        {
          body: conversationId ? { conversationId } : {},
        }
      );
    },
    [conversationId, append, addConversation, activeUser?.id]
  );

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex w-full h-screen relative">
      <div className="absolute inset-0 dark:bg-sidebar !fixed z-0">
        {/* Light mode gradient */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-0"
          style={{
            backgroundImage: `radial-gradient(closest-corner at 120px 36px, rgba(255, 255, 255, 0.17), rgba(255, 255, 255, 0)), linear-gradient(rgb(254, 247, 255) 15%, rgb(244, 214, 250))`,
          }}
        ></div>
        {/* Dark mode gradient */}
        <div
          className="absolute inset-0 opacity-0 dark:opacity-40"
          style={{
            backgroundImage: `radial-gradient(closest-corner at 120px 36px, rgba(255, 1, 111, 0.19), rgba(255, 1, 111, 0.08)), linear-gradient(rgb(63, 51, 69) 15%, rgb(7, 3, 9))`,
          }}
        ></div>
        <div className="absolute inset-0 bg-noise"></div>
        <div className="absolute inset-0 bg-black/40 dark:block hidden"></div>
      </div>

      {/* Mobile sidebar toggle button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 md:hidden bg-chat-background/80 backdrop-blur-sm border border-chat-border/50 hover:bg-chat-background"
        aria-label={isSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {isSidebarOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </Button>

      {/* Sidebar with overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <Sidebar
        setMessages={setMessages}
        setConversationId={setConversationId}
        conversations={conversations}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 relative z-10">
        <ChatContainer
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          handleSuggestionSelect={handleSuggestionSelect}
        />
      </div>
    </div>
  );
};
