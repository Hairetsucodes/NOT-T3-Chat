"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Pin, X, Loader2, GitBranch } from "lucide-react";
import { Conversation } from "@prisma/client";
import { ChatContext } from "@/context/ChatContext";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SettingsModal from "@/components/settings/SettingsModal";
import { ScrollArea } from "@/components/ui/scroll-area";

type ConversationWithLoading = Conversation & {
  isLoading?: boolean;
};

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;
  conversations: ConversationWithLoading[];
  isOpen?: boolean;
  onClose?: () => void;
}

export function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const [searchValue, setSearchValue] = useState("");
  const {
    conversations,
    pinnedConversations,
    unpinnedConversations,
    activeUser,
    setConversationId,
    setMessages,
    togglePinConversation,
    deleteConversation,
  } = useContext(ChatContext);
  return (
    <>
      {/* Sidebar - Hidden on desktop md+, toggleable on mobile */}
      <div
        className={`${
          isOpen ? "flex" : "hidden"
        } md:flex md:w-[16rem] flex-col h-screen fixed md:relative inset-y-0 left-0 w-[16rem] z-50 md:z-auto bg-sidebar md:bg-transparent`}
      >
        <div className="inset-y-0 transition-[transform,opacity] ease-snappy flex left-0 group-data-[collapsible=offcanvas]:-translate-x-[var(--sidebar-width)] p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)] group border-none flex-1">
          <div className="flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow">
            {/* Header */}
            <div className="w-full justify-center items-center flex pb-3 flex-shrink-0">
              OSS T3.chat
            </div>
            <div className="flex flex-col gap-2 relative m-1 mb-0 space-y-1 p-0 !pt-safe flex-shrink-0">
              <div className="px-1">
                <Button
                  variant="callToAction"
                  className="w-full"
                  onClick={() => {
                    setConversationId(null);
                    setMessages([]);
                    window.history.replaceState(null, "", "/chat");
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

            {/* Content - Scrollable Area */}
            <div className="flex-1 overflow-hidden">
              <ScrollArea className="rounded-md h-[calc(98vh-14rem)]">
                <div className="relative flex w-full min-w-0 flex-col p-2">
                  {(() => {
                    const getTimeLabel = (
                      date: Date
                    ): { label: string; daysAgo: number } => {
                      const now = new Date();
                      const conversationDate = new Date(date);

                      const diffTime =
                        now.getTime() - conversationDate.getTime();
                      const diffDays = Math.floor(
                        diffTime / (1000 * 60 * 60 * 24)
                      );

                      if (diffDays === -1)
                        return { label: "Yesterday", daysAgo: 1 };
                      if (diffDays <= 0) return { label: "Today", daysAgo: 0 };
                      if (diffDays === 1)
                        return { label: "Yesterday", daysAgo: 1 };
                      if (diffDays < 7)
                        return {
                          label: `${diffDays} days ago`,
                          daysAgo: diffDays,
                        };
                      if (diffDays < 30)
                        return {
                          label: `${Math.floor(diffDays / 7)} week${
                            Math.floor(diffDays / 7) > 1 ? "s" : ""
                          } ago`,
                          daysAgo: diffDays,
                        };
                      return {
                        label: `${Math.floor(diffDays / 30)} month${
                          Math.floor(diffDays / 30) > 1 ? "s" : ""
                        } ago`,
                        daysAgo: diffDays,
                      };
                    };

                    // Group unpinned conversations by time
                    const groupedConversations = unpinnedConversations.reduce(
                      (groups, conversation) => {
                        const updatedAt = conversation.updatedAt || new Date();
                        const { label, daysAgo } = getTimeLabel(updatedAt);

                        if (!groups[label]) {
                          groups[label] = { conversations: [], daysAgo };
                        }
                        groups[label].conversations.push(conversation);
                        return groups;
                      },
                      {} as Record<
                        string,
                        { conversations: typeof conversations; daysAgo: number }
                      >
                    );

                    const sortedGroups = Object.entries(
                      groupedConversations
                    ).sort(([, a], [, b]) => {
                      return a.daysAgo - b.daysAgo;
                    });

                    if (conversations.length === 0) {
                      return (
                        <div className="w-full text-sm">
                          <ul className="flex w-full min-w-0 flex-col gap-1">
                            <li className="group/menu-item relative">
                              <div className="relative flex h-9 w-full items-center overflow-hidden rounded-lg px-2 py-1 text-sm text-muted-foreground/50">
                                No conversations yet
                              </div>
                            </li>
                          </ul>
                        </div>
                      );
                    }

                    const renderConversationList = (
                      conversations: (typeof groupedConversations)[0]["conversations"]
                    ) => (
                      <div className="w-full text-sm">
                        <ul className="flex w-full min-w-0 flex-col gap-1">
                          {conversations.map((thread) => (
                            <li
                              key={thread.id}
                              className="group/menu-item relative"
                            >
                              {thread.isLoading ? (
                                // Loading conversation - not clickable
                                <div className="group/link relative flex h-9 w-full items-center overflow-hidden rounded-lg px-2 py-1 text-sm text-muted-foreground/70 cursor-default">
                                  <div className="relative flex w-full items-center">
                                    <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                                    <div className="relative w-full">
                                      <span className="text-sm">
                                        {thread.title}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                // Regular conversation - clickable
                                <Link
                                  className="group/link relative flex h-9 w-full items-center overflow-hidden rounded-lg px-2 py-1 text-sm outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring hover:focus-visible:bg-sidebar-accent"
                                  href={`/chat/${thread.id}`}
                                  onClick={() => onClose?.()}
                                >
                                  <div className="relative flex w-full items-center">
                                    <div className="relative w-full flex items-center gap-2">
                                      {thread.branchedFromConvoId && (
                                        <span className="text-xs text-muted-foreground">
                                          <GitBranch className="size-4" />
                                        </span>
                                      )}
                                      <input
                                        aria-label="Thread title"
                                        readOnly
                                        tabIndex={-1}
                                        className="hover:truncate-none h-full w-full rounded bg-transparent px-1 py-1 text-sm text-muted-foreground outline-none pointer-events-none cursor-pointer overflow-hidden truncate"
                                        title={thread.title}
                                        type="text"
                                        value={thread.title}
                                      />
                                    </div>
                                    <div className="pointer-events-auto absolute -right-1 bottom-0 top-0 z-50 flex translate-x-full items-center justify-end text-muted-foreground transition-transform group-hover/link:translate-x-0 group-hover/link:bg-sidebar-accent">
                                      <div className="pointer-events-none absolute bottom-0 right-[100%] top-0 h-12 w-8 bg-gradient-to-l from-sidebar-accent to-transparent opacity-0 group-hover/link:opacity-100" />
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="rounded-md p-1.5 hover:bg-muted/40"
                                        tabIndex={-1}
                                        aria-label="Pin thread"
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();

                                          await togglePinConversation(
                                            thread.id
                                          );
                                        }}
                                      >
                                        <Pin
                                          className={`size-4 ${
                                            thread.isPinned
                                              ? "fill-current"
                                              : ""
                                          }`}
                                        />
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="ghost"
                                        className="rounded-md p-1.5 hover:bg-destructive/50 hover:text-destructive-foreground"
                                        tabIndex={-1}
                                        aria-label="Delete thread"
                                        onClick={async (e) => {
                                          e.preventDefault();
                                          e.stopPropagation();

                                          // Confirm deletion
                                          if (
                                            !confirm(
                                              `Are you sure you want to delete "${thread.title}"?`
                                            )
                                          ) {
                                            return;
                                          }

                                          try {
                                            await deleteConversation(thread.id);
                                          } catch (error) {
                                            console.error(
                                              "Failed to delete conversation:",
                                              error
                                            );
                                            alert(
                                              "Failed to delete conversation. Please try again."
                                            );
                                          }
                                        }}
                                      >
                                        <X className="size-4" />
                                      </Button>
                                    </div>
                                  </div>
                                </Link>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    );

                    return (
                      <>
                        {/* Pinned conversations section */}
                        {pinnedConversations.length > 0 && (
                          <div className="mb-4">
                            <div className="flex h-8 shrink-0 select-none items-center rounded-md text-xs font-medium outline-none ring-sidebar-ring transition-[margin,opa] duration-200 ease-snappy focus-visible:ring-2 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 px-1.5 ">
                              <span className="text-gray-400 flex items-center gap-1">
                                <Pin className="size-3" />
                                Pinned
                              </span>
                            </div>
                            {renderConversationList(pinnedConversations)}
                          </div>
                        )}

                        {/* Time-grouped unpinned conversations */}
                        {sortedGroups.map(
                          ([
                            timeLabel,
                            { conversations: groupConversations },
                          ]) => (
                            <div key={timeLabel} className="mb-4">
                              <div className="flex h-8 shrink-0 select-none items-center rounded-md text-xs font-medium outline-none ring-sidebar-ring transition-[margin,opa] duration-200 ease-snappy focus-visible:ring-2 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 px-1.5 ">
                                <span className="text-gray-400">
                                  {timeLabel}
                                </span>
                              </div>
                              {renderConversationList(groupConversations)}
                            </div>
                          )
                        )}
                      </>
                    );
                  })()}
                </div>
              </ScrollArea>
            </div>

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
                <DialogContent className="h-[90vh] w-[90vw] max-w-[90vw] max-sm:h-[90vh] max-sm:w-[90vw]">
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
