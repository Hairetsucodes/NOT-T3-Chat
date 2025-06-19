"use client";

import { useContext, useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Conversation } from "@prisma/client";
import { ChatContext } from "@/context/ChatContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SettingsModal from "@/components/settings/SettingsModal";
import { useRouter } from "next/navigation";
import RenderList from "./conversations/RenderList";

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
  const { conversations, activeUser, setConversationId, setMessages } =
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

            {/* Footer */}
            <div className="flex flex-col gap-2 m-0 p-2 pt-0 justify-end flex-shrink-0">
              <Dialog>
                <DialogTrigger asChild>
                  <button
                    aria-label="Go to settings"
                    className="flex select-none flex-row items-center justify-between gap-3 rounded-lg px-3 py-3 hover:bg-sidebar-accent focus:bg-sidebar-accent focus:outline-2 w-full text-left"
                  >
                    <div className="flex w-full min-w-0 flex-row items-center gap-3">
                      {activeUser?.image ? (
                        <Image
                          alt={activeUser.name || "User"}
                          loading="lazy"
                          width={32}
                          height={32}
                          className="h-8 w-8 rounded-full ring-1 ring-muted-foreground/20"
                          src={activeUser.image}
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-muted flex items-center justify-center ring-1 ring-muted-foreground/20">
                          <span className="text-sm font-medium">
                            {activeUser?.username?.[0] ||
                              activeUser?.name?.[0] ||
                              "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col text-foreground">
                        <span className="truncate text-sm font-medium">
                          {activeUser?.username || activeUser?.name || "User"}
                        </span>
                        <span className="text-xs">OSS FREE FOR EVER</span>
                      </div>
                    </div>
                  </button>
                </DialogTrigger>
                <DialogContent
                  aria-describedby={undefined}
                  className="h-[90vh] w-[90vw] max-w-[90vw] max-sm:h-[90vh] max-sm:w-[90vw]"
                >
                  <DialogTitle className="sr-only">Settings</DialogTitle>
                  <SettingsModal />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
