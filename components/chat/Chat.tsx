"use client";
import { useContext, useState } from "react";
import { Sidebar } from "./Sidebar";
import { ChatContainer } from "./Container";
import { ChatContext } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { List, Menu, SidebarIcon, X } from "lucide-react";

export const Chat = ({ welcomeMessage }: { welcomeMessage?: boolean }) => {
  // Separate states for mobile and desktop sidebars
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarOpen, setIsDesktopSidebarOpen] = useState(true);

  const {
    conversations,
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    handleSuggestionSelect,
  } = useContext(ChatContext);

  const toggleMobileSidebar = () => {
    setIsMobileSidebarOpen(!isMobileSidebarOpen);
  };

  const toggleDesktopSidebar = () => {
    setIsDesktopSidebarOpen(!isDesktopSidebarOpen);
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

      {/* Mobile sidebar toggle button - only visible on mobile */}
      <Button
        variant={"ghost"}
        size="icon"
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-[60] md:hidden bg-chat-background/80 backdrop-blur-sm border border-chat-border/50 hover:bg-chat-background"
        aria-label={isMobileSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {isMobileSidebarOpen ? (
          <SidebarIcon className="h-5 w-5" />
        ) : (
          <SidebarIcon className="h-5 w-5" />
        )}
      </Button>

      {/* Desktop sidebar toggle button - only visible on desktop */}
      <Button
        variant={"ghost"}
        size="icon"
        onClick={toggleDesktopSidebar}
        className="fixed top-4 left-4 p-1 z-[60] hidden md:block bg-chat-background/80 backdrop-blur-sm border border-chat-border/50 hover:bg-chat-background"
        aria-label={isDesktopSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        {isDesktopSidebarOpen ? (
          <SidebarIcon className="h-5 w-5" />
        ) : (
          <SidebarIcon className="h-5 w-5" />
        )}
      </Button>

      {/* Mobile sidebar with overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar - only visible on mobile */}
      <div className="md:hidden">
        <Sidebar
          conversations={conversations}
          isOpen={isMobileSidebarOpen}
          onClose={() => setIsMobileSidebarOpen(false)}
          isMobile={true}
        />
      </div>

      {/* Desktop Sidebar - only visible on desktop */}
      <div className="hidden md:block">
        <Sidebar
          conversations={conversations}
          isOpen={isDesktopSidebarOpen}
          onClose={() => setIsDesktopSidebarOpen(false)}
          isMobile={false}
        />
      </div>

      <div className="flex-1 relative z-10">
        <ChatContainer
          messages={messages}
          input={input}
          isLoading={isLoading}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          handleSuggestionSelect={handleSuggestionSelect}
          welcomeMessage={welcomeMessage}
        />
      </div>
    </div>
  );
};
