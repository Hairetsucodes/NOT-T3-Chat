"use client";
import { useContext, useState } from "react";
import { Sidebar } from "./Sidebar";
import { ChatContainer } from "./Container";
import { ChatContext } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Menu, X } from "lucide-react";

export const Chat = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const {
    conversations,
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    handleSuggestionSelect,
  } = useContext(ChatContext);

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
        conversations={conversations}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <div className="flex-1 relative z-10">
        <ChatContainer
          messages={messages}
          input={input}
          isLoading={isLoading}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          handleSuggestionSelect={handleSuggestionSelect}
        />
      </div>
    </div>
  );
};
