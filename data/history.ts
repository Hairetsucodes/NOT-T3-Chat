"use server";

import { checkUser } from "@/lib/auth/check";
import { prisma } from "../prisma";
import { Conversation } from "@prisma/client";
import { UserChatHistory, FormattedConversation, HistoryStats } from "@/types/history";

export const getUserChatHistory = async (
  userId: string
): Promise<UserChatHistory | { error: string }> => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {
    const conversations = await prisma.conversation.findMany({
      where: { userId },
      include: {
        Message: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedConversations: FormattedConversation[] = conversations.map(
      (conv) => ({
        id: conv.id,
        title: conv.title,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        messageCount: conv.Message.length,
        messages: conv.Message.map((msg) => ({
          id: msg.id,
          content: msg.content,
          role: msg.role,
          provider: msg.provider,
          model: msg.model,
          reasoningContent: msg.reasoningContent,
          createdAt: msg.createdAt.toISOString(),
          updatedAt: msg.updatedAt.toISOString(),
        })),
      })
    );

    const totalMessages = formattedConversations.reduce(
      (sum, conv) => sum + conv.messageCount,
      0
    );

    return {
      userId,
      totalConversations: conversations.length,
      totalMessages,
      exportedAt: new Date().toISOString(),
      conversations: formattedConversations,
    };
  } catch (error) {
    console.error("Failed to get user chat history:", error);
    return { error: "Failed to retrieve chat history" };
  }
};

export const getHistoryStats = async (
  userId: string
): Promise<HistoryStats | { error: string }> => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {
    const [conversations, messages] = await Promise.all([
      prisma.conversation.findMany({
        where: { userId },
        select: { createdAt: true },
        orderBy: { createdAt: "asc" },
      }),
      prisma.message.findMany({
        where: { userId },
        select: { role: true, provider: true },
      }),
    ]);

    // Count providers
    const providers: { [key: string]: number } = {};
    const messagesByRole: { [key: string]: number } = {};

    messages.forEach((msg) => {
      providers[msg.provider] = (providers[msg.provider] || 0) + 1;
      messagesByRole[msg.role] = (messagesByRole[msg.role] || 0) + 1;
    });

    return {
      totalConversations: conversations.length,
      totalMessages: messages.length,
      oldestConversation:
        conversations.length > 0
          ? conversations[0].createdAt.toISOString()
          : undefined,
      newestConversation:
        conversations.length > 0
          ? conversations[conversations.length - 1].createdAt.toISOString()
          : undefined,
      providers,
      messagesByRole,
    };
  } catch (error) {
    console.error("Failed to get history stats:", error);
    return { error: "Failed to retrieve history statistics" };
  }
};

export const clearAllHistory = async (
  userId: string
): Promise<{ success: boolean } | { error: string }> => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {


    // Then delete all conversations
    await prisma.conversation.deleteMany({
      where: { userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    return { error: "Failed to clear chat history" };
  }
};

// Clear history older than specified date
export const clearHistoryOlderThan = async (
  userId: string,
  olderThanDate: Date
): Promise<
  { deletedConversations: number; deletedMessages: number } | { error: string }
> => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {
    // Get conversations to delete
    const conversationsToDelete = await prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { lt: olderThanDate },
      },
      select: { id: true },
    });

    const conversationIds = conversationsToDelete.map((c) => c.id);

    // Delete messages in those conversations
    const deletedMessages = await prisma.message.deleteMany({
      where: {
        conversationId: { in: conversationIds },
      },
    });

    // Delete the conversations
    const deletedConversations = await prisma.conversation.deleteMany({
      where: {
        userId,
        createdAt: { lt: olderThanDate },
      },
    });

    return {
      deletedConversations: deletedConversations.count,
      deletedMessages: deletedMessages.count,
    };
  } catch (error) {
    console.error("Failed to clear old history:", error);
    return { error: "Failed to clear old history" };
  }
};

// Import chat history from formatted structure
export const importChatHistory = async (
  userId: string,
  historyData: UserChatHistory,
  options: {
    overwrite?: boolean;
    skipExisting?: boolean;
    transferFromDifferentUser?: boolean;
  } = {}
): Promise<
  | {
      importedConversations: number;
      importedMessages: number;
      skippedConversations: number;
    }
  | { error: string }
> => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  // Allow importing from different users when transferFromDifferentUser is true
  if (historyData.userId !== userId && !options.transferFromDifferentUser) {
    return {
      error:
        "History data belongs to a different user. Set transferFromDifferentUser option to import anyway.",
    };
  }

  try {
    let importedConversations = 0;
    let importedMessages = 0;
    let skippedConversations = 0;

    for (const conv of historyData.conversations) {
      try {
        // Check if conversation already exists (only relevant for same-user imports)
        let existingConv = null;
        if (!options.transferFromDifferentUser || historyData.userId === userId) {
          existingConv = await prisma.conversation.findFirst({
            where: {
              userId,
              id: conv.id,
            },
          });

          if (existingConv && !options.overwrite) {
            if (options.skipExisting) {
              skippedConversations++;
              continue;
            } else {
              return {
                error: `Conversation ${conv.title} already exists. Use overwrite option to replace.`,
              };
            }
          }
        }

      let conversation;
      
      if (options.transferFromDifferentUser && historyData.userId !== userId) {
        // When transferring from different user, always create new conversation with new ID
        conversation = await prisma.conversation.create({
          data: {
            userId, // Always assign to current user
            title: conv.title,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
          },
        });
      } else {
        // When importing from same user, use original ID and upsert
        conversation = await prisma.conversation.upsert({
          where: { id: conv.id },
          update: {
            title: conv.title,
            updatedAt: new Date(conv.updatedAt),
          },
          create: {
            id: conv.id,
            userId, // Always assign to current user
            title: conv.title,
            createdAt: new Date(conv.createdAt),
            updatedAt: new Date(conv.updatedAt),
          },
        });
      }

      // If overwriting, delete existing messages
      if (existingConv && options.overwrite) {
        await prisma.message.deleteMany({
          where: { conversationId: conv.id },
        });
      }

              // Import messages
        for (const msg of conv.messages) {
          if (options.transferFromDifferentUser && historyData.userId !== userId) {
            // When transferring from different user, always create new message with new ID
            await prisma.message.create({
              data: {
                userId, // Always assign to current user
                conversationId: conversation.id,
                content: msg.content,
                role: msg.role,
                provider: msg.provider,
                model: msg.model,
                reasoningContent: msg.reasoningContent,
                createdAt: new Date(msg.createdAt),
                updatedAt: new Date(msg.updatedAt),
              },
            });
          } else {
            // When importing from same user, use original ID and upsert
            await prisma.message.upsert({
              where: { id: msg.id },
              update: {
                content: msg.content,
                role: msg.role,
                provider: msg.provider,
                model: msg.model,
                reasoningContent: msg.reasoningContent,
                updatedAt: new Date(msg.updatedAt),
              },
              create: {
                id: msg.id,
                userId, // Always assign to current user
                conversationId: conversation.id,
                content: msg.content,
                role: msg.role,
                provider: msg.provider,
                model: msg.model,
                reasoningContent: msg.reasoningContent,
                createdAt: new Date(msg.createdAt),
                updatedAt: new Date(msg.updatedAt),
              },
            });
          }
          importedMessages++;
        }

      importedConversations++;
      } catch (error) {
        console.error(`Failed to import conversation "${conv.title}":`, error);
        return { error: `Failed to import conversation "${conv.title}": ${error instanceof Error ? error.message : 'Unknown error'}` };
      }
    }

    return {
      importedConversations,
      importedMessages,
      skippedConversations,
    };
  } catch (error) {
    console.error("Failed to import chat history:", error);
    return { error: "Failed to import chat history" };
  }
};

// Delete specific conversation
export const deleteConversation = async (
  userId: string,
  conversationId: string
): Promise<{ success: boolean } | { error: string }> => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {
    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId,
      },
    });

    if (!conversation) {
      return { error: "Conversation not found or access denied" };
    }

    // Delete messages first
    await prisma.message.deleteMany({
      where: { conversationId },
    });

    // Delete conversation
    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    return { error: "Failed to delete conversation" };
  }
};

// Get conversations with pagination
export const getConversationsPaginated = async (
  userId: string,
  options: {
    limit?: number;
    offset?: number;
    search?: string;
    sortBy?: "createdAt" | "updatedAt" | "title";
    sortOrder?: "asc" | "desc";
  } = {}
): Promise<
  | {
      conversations: (Conversation & { messageCount: number })[];
      total: number;
      hasMore: boolean;
    }
  | { error: string }
> => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  const {
    limit = 20,
    offset = 0,
    search = "",
    sortBy = "updatedAt",
    sortOrder = "desc",
  } = options;

  try {
    const whereClause = {
      userId,
      ...(search && {
        title: {
          contains: search,
          mode: "insensitive" as const,
        },
      }),
    };

    const [conversations, total] = await Promise.all([
      prisma.conversation.findMany({
        where: whereClause,
        include: {
          _count: {
            select: { Message: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        take: limit,
        skip: offset,
      }),
      prisma.conversation.count({ where: whereClause }),
    ]);

    const formattedConversations = conversations.map((conv) => ({
      ...conv,
      messageCount: conv._count.Message,
    }));

    return {
      conversations: formattedConversations,
      total,
      hasMore: offset + limit < total,
    };
  } catch (error) {
    console.error("Failed to get paginated conversations:", error);
    return { error: "Failed to retrieve conversations" };
  }
};



// Sync history between accounts (placeholder for future implementation)
export const prepareSyncData = async (
  userId: string
): Promise<
  | {
      syncToken: string;
      lastSyncAt: string;
      historyHash: string;
    }
  | { error: string }
> => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {
    // Get basic info for sync preparation
    const stats = await getHistoryStats(userId);

    if ("error" in stats) {
      return stats;
    }

    // Generate a simple hash based on conversation count and last update
    const historyHash = Buffer.from(
      `${stats.totalConversations}-${stats.totalMessages}-${
        stats.newestConversation || ""
      }`
    ).toString("base64");

    return {
      syncToken: `sync_${userId}_${Date.now()}`,
      lastSyncAt: new Date().toISOString(),
      historyHash,
    };
  } catch (error) {
    console.error("Failed to prepare sync data:", error);
    return { error: "Failed to prepare sync data" };
  }
};
