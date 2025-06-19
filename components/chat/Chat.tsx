"use client";
import { useContext, useState } from "react";
import { Sidebar } from "./Sidebar";
import { ChatContainer } from "./Container";
import { ChatContext } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { SidebarIcon } from "lucide-react";
import BackgroundGradient from "../ui/background-gradient";

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
      <BackgroundGradient />

      {/* Mobile sidebar toggle button - only visible on mobile */}
      <Button
        variant={"ghost"}
        size="icon"
        onClick={toggleMobileSidebar}
        className="fixed top-4 left-4 z-[60] md:hidden bg-transparent border-none "
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
        className="fixed top-4 left-4 z-[60] hidden md:block bg-transparent border-none "
        aria-label={isDesktopSidebarOpen ? "Hide sidebar" : "Show sidebar"}
      >
        <span className="w-full flex justify-center items-center">
          {isDesktopSidebarOpen ? (
            <SidebarIcon className="h-5 w-5" />
          ) : (
            <SidebarIcon className="h-5 w-5" />
          )}
        </span>
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
