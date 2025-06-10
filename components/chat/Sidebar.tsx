"use client";

import { useContext, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Pin, X } from "lucide-react";
import { Message } from "ai";
import { Conversation } from "@prisma/client";
import { ChatContext } from "@/context/ChatContext";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import SettingsModal from "@/components/settings/SettingsModal";

interface SidebarProps {
  isCollapsed?: boolean;
  onToggle?: () => void;

  setMessages: (messages: Message[]) => void;
  setConversationId: (conversationId: string | null) => void;
  conversations: Conversation[];
}

export function Sidebar({ setConversationId, setMessages }: SidebarProps) {
  const [searchValue, setSearchValue] = useState("");
  const { conversations, activeUser } = useContext(ChatContext);
  const router = useRouter();
  return (
    <>
      {/* Sidebar */}
      <div className="w-[16rem] h-screen flex flex-col">
        <div className="inset-y-0 hidden transition-[transform,opacity] ease-snappy md:flex left-0 group-data-[collapsible=offcanvas]:-translate-x-[var(--sidebar-width)] p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)_+_theme(spacing.4)_+2px)] group z-50 border-none flex-1">
          <div className="flex h-full w-full flex-col group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow">
            {/* Header */}
            <div className="w-full justify-center items-center flex pb-3">
              OSS T3.chat
            </div>
            <div className="flex flex-col gap-2 relative m-1 mb-0 space-y-1 p-0 !pt-safe">
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

            {/* Content */}
            <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-auto group-data-[collapsible=icon]:overflow-hidden small-scrollbar scroll-shadow relative pb-2">
              <div className="relative flex w-full min-w-0 flex-col p-2">
                <div className="flex h-8 shrink-0 select-none items-center rounded-md text-xs font-medium outline-none ring-sidebar-ring transition-[margin,opa] duration-200 ease-snappy focus-visible:ring-2 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 px-1.5 text-color-heading">
                  <span>Today</span>
                </div>

                <div className="w-full text-sm">
                  <ul className="flex w-full min-w-0 flex-col gap-1">
                    {conversations.length > 0 ? (
                      conversations.map((thread) => (
                        <li
                          key={thread.id}
                          className="group/menu-item relative"
                        >
                          <Link
                            className="group/link relative flex h-9 w-full items-center overflow-hidden rounded-lg px-2 py-1 text-sm outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring hover:focus-visible:bg-sidebar-accent"
                            href={`/chat/${thread.id}`}
                          >
                            <div className="relative flex w-full items-center">
                              <div className="relative w-full">
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
                                >
                                  <Pin className="size-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="rounded-md p-1.5 hover:bg-destructive/50 hover:text-destructive-foreground"
                                  tabIndex={-1}
                                  aria-label="Delete thread"
                                >
                                  <X className="size-4" />
                                </Button>
                              </div>
                            </div>
                          </Link>
                        </li>
                      ))
                    ) : (
                      <li className="group/menu-item relative">
                        <div className="relative flex h-9 w-full items-center overflow-hidden rounded-lg px-2 py-1 text-sm text-muted-foreground/50">
                          No conversations yet
                        </div>
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex flex-col gap-2 m-0 p-2 pt-0 justify-end">
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
                            {activeUser?.name?.[0] || "U"}
                          </span>
                        </div>
                      )}
                      <div className="flex min-w-0 flex-col text-foreground">
                        <span className="truncate text-sm font-medium">
                          {activeUser?.name || "User"}
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
