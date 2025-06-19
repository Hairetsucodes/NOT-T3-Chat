"use client";

import { useContext, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Conversation } from "@prisma/client";
import { ChatContext } from "@/context/ChatContext";
import { useRouter } from "next/navigation";
import RenderList from "./conversations/RenderList";
import DialogFooter from "./conversations/Footer";

type ConversationWithLoading = Conversation & {
  isLoading?: boolean;
  isRetry?: boolean;
};

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  conversations: ConversationWithLoading[];
  isOpen?: boolean;
  onClose?: () => void;
  isMobile?: boolean;
}

export function Sidebar({
  isOpen = false,
  onClose,
  isMobile = false,
}: SidebarProps) {
  const [searchValue, setSearchValue] = useState("");
  const router = useRouter();
  const { conversations, setConversationId, setMessages } =
    useContext(ChatContext);
  const [searchResults, setSearchResults] =
    useState<ConversationWithLoading[]>(conversations);

  useEffect(() => {
    if (searchValue) {
      setSearchResults(
        conversations.filter((conversation) =>
          conversation.title.toLowerCase().includes(searchValue.toLowerCase())
        )
      );
    } else {
      setSearchResults(conversations);
    }
  }, [searchValue, conversations]);

  const filteredPinnedConversations = searchResults.filter(
    (conv) => conv.isPinned
  );
  const filteredUnpinnedConversations = searchResults.filter(
    (conv) => !conv.isPinned
  );

  return (
    <>
      {/* Sidebar - Toggleable on all screen sizes */}
      <div
        className={`${
          isOpen ? "flex" : "hidden"
        } w-[17rem] flex-col h-screen fixed md:relative inset-y-0 left-0 z-50 md:z-auto bg-sidebar md:bg-transparent`}
      >
        <div className="inset-y-0 transition-[transform,opacity] ease-snappy flex left-0 group-data-[collapsible=offcanvas]:-translate-x-[var(--sidebar-width)] p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)] group border-none flex-1">
          <div className="flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow">
            {/* Header */}
            <div className="w-full justify-center items-center flex pb-3 flex-shrink-0">
              <h2 className="text-lg font-semibold tracking-tight pt-2">
                <span className="bg-gradient-to-r from-pink-700 to-pink-900 dark:from-pink-400 dark:to-pink-300 bg-clip-text text-transparent">
                  <span className="underline decoration-pink-700 dark:decoration-pink-400 decoration-2 underline-offset-2 font-extrabold">
                    NOT
                  </span>{" "}
                  T3.Chat
                </span>
              </h2>
            </div>
            <div className="flex flex-col gap-2 relative m-1 mb-0 space-y-1 p-0 !pt-safe flex-shrink-0">
              <div className="px-1">
                <Button
                  variant="callToAction"
                  className="w-full"
                  onClick={() => {
                    setConversationId(null);
                    setMessages([]);
                    router.push("/chat");
                  }}
                >
                  <span className="w-full select-none text-center text-sm ">
                    New Chat
                  </span>
                </Button>
              </div>

              <div className="border-b px-3">
                <div className="flex items-center">
                  <Search className="-ml-[3px] mr-3 !size-4 text-muted-foreground" />
                  <Input
                    role="searchbox"
                    aria-label="Search threads"
                    placeholder="Search your threads..."
                    className="w-full bg-transparent py-2 text-sm text-foreground placeholder-muted-foreground/50 placeholder:select-none focus:outline-none border-none"
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Conversation List */}
            <RenderList
              filteredPinnedConversations={filteredPinnedConversations}
              filteredUnpinnedConversations={filteredUnpinnedConversations}
              isMobile={isMobile}
              onClose={onClose || (() => {})}
            />

            {/* User Settings Footer */}
            <DialogFooter
              filteredPinnedConversations={filteredPinnedConversations}
              filteredUnpinnedConversations={filteredUnpinnedConversations}
              isMobile={isMobile}
              onClose={onClose || (() => {})}
            />
          </div>
        </div>
      </div>
    </>
  );
}
