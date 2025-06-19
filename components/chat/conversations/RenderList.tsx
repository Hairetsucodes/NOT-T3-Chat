import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { RefreshCcw, GitBranch, Pin, X } from "lucide-react";
import { ConversationWithLoading } from "@/types/chat";
import { ChatContext } from "@/context/ChatContext";
import { useContext } from "react";

export default function RenderList({
  filteredPinnedConversations,
  filteredUnpinnedConversations,
  isMobile = false,
  onClose,
}: {
  filteredPinnedConversations: ConversationWithLoading[];
  filteredUnpinnedConversations: ConversationWithLoading[];
  isMobile: boolean;
  onClose: () => void;
}) {
  const { togglePinConversation, deleteConversation } = useContext(ChatContext);
  return (
    <div className="flex-1 overflow-hidden">
      <ScrollArea className="rounded-md h-[calc(98vh-14rem)]">
        <div className="relative flex w-full min-w-0 flex-col p-2">
          {(() => {
            const getTimeLabel = (
              date: Date
            ): { label: string; daysAgo: number } => {
              const now = new Date();
              const conversationDate = new Date(date);

              const diffTime = now.getTime() - conversationDate.getTime();
              const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

              if (diffDays === -1) return { label: "Yesterday", daysAgo: 1 };
              if (diffDays <= 0) return { label: "Today", daysAgo: 0 };
              if (diffDays === 1) return { label: "Yesterday", daysAgo: 1 };
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

            const renderConversationList = (
              conversations: ConversationWithLoading[]
            ) => (
              <div className="w-full text-sm">
                <ul className="flex w-full min-w-0 flex-col gap-1">
                  {conversations.map((thread) => (
                    <li key={thread.id} className="group/menu-item relative">
                      {thread.isLoading ? (
                        // Loading conversation - not clickable
                        <div className="group/link relative flex h-9 w-full items-center overflow-hidden rounded-lg px-2 py-1 text-sm text-muted-foreground/70 cursor-default">
                          <div className="relative flex w-full items-center">
                            <Loader2 className="h-3 w-3 mr-2 animate-spin" />
                            <div className="relative w-full flex items-center justify-between">
                              <span className="text-sm">{thread.title}</span>
                              <Loader2 className="h-3 w-3 animate-spin ml-2" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Link
                          className="group/link relative flex h-9 w-full items-center overflow-hidden rounded-lg px-2 py-1 text-sm outline-none hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:text-sidebar-accent-foreground focus-visible:ring-2 focus-visible:ring-sidebar-ring hover:focus-visible:bg-sidebar-accent"
                          href={`/chat/${thread.id}`}
                          onClick={() => {
                            if (isMobile) {
                              onClose?.();
                            }
                          }}
                        >
                          <div className="relative flex w-full items-center">
                            <div className="relative w-full flex items-center gap-2">
                              {thread.isRetry && (
                                <RefreshCcw className="size-4 text-muted-foreground" />
                              )}
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
                              {thread.isGenerating && (
                                <span className="text-xs text-muted-foreground">
                                  <Loader2 className="size-4 animate-spin" />
                                </span>
                              )}
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

                                  await togglePinConversation(thread.id);
                                }}
                              >
                                <Pin
                                  className={`size-4 ${
                                    thread.isPinned ? "fill-current" : ""
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
                {filteredPinnedConversations.length > 0 && (
                  <div className="mb-4">
                    <div className="flex h-8 shrink-0 select-none items-center rounded-md text-xs font-medium outline-none ring-sidebar-ring transition-[margin,opa] duration-200 ease-snappy focus-visible:ring-2 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 px-1.5 ">
                      <span className="text-color-heading flex items-center gap-1">
                        <Pin className="size-3" />
                        Pinned
                      </span>
                    </div>
                    {renderConversationList(filteredPinnedConversations)}
                  </div>
                )}

                {/* Time-grouped unpinned conversations */}
                {(() => {
                  // Group unpinned conversations by time
                  const groupedConversations =
                    filteredUnpinnedConversations.reduce(
                      (groups, conversation) => {
                        const updatedAt = conversation.updatedAt || new Date();
                        const { label, daysAgo } = getTimeLabel(updatedAt);

                        if (!groups[label]) {
                          groups[label] = {
                            conversations: [],
                            daysAgo,
                          };
                        }
                        groups[label].conversations.push(conversation);
                        return groups;
                      },
                      {} as Record<
                        string,
                        {
                          conversations: ConversationWithLoading[];
                          daysAgo: number;
                        }
                      >
                    );

                  const sortedGroups = Object.entries(
                    groupedConversations
                  ).sort(([, a], [, b]) => {
                    return a.daysAgo - b.daysAgo;
                  });

                  return (
                    <>
                      {sortedGroups.map(
                        ([
                          timeLabel,
                          { conversations: groupConversations },
                        ]) => (
                          <div key={timeLabel} className="mb-4">
                            <div className="flex h-8 shrink-0 select-none items-center rounded-md text-xs font-medium outline-none ring-sidebar-ring transition-[margin,opa] duration-200 ease-snappy focus-visible:ring-2 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 px-1.5 ">
                              <span className="text-color-heading font-semibold">
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
              </>
            );
          })()}
        </div>
      </ScrollArea>
    </div>
  );
}
