"use server";

import { checkUser } from "@/lib/auth/check";
import { prisma } from "../prisma";
import { Conversation } from "@prisma/client";
import {
  UserChatHistory,
  FormattedConversation,
  HistoryStats,
} from "@/types/history";
import {
  ClearHistoryOlderThanSchema,
  DeleteConversationSchema,
  GetConversationsPaginatedSchema,
  ImportChatHistorySchema,
} from "@/schemas/history";

export const getUserChatHistory = async (): Promise<
  UserChatHistory | { error: string }
> => {
  try {
    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }
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
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to retrieve chat history" };
  }
};

export const getHistoryStats = async (): Promise<
  HistoryStats | { error: string }
> => {
  try {
    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }
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
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to retrieve history statistics" };
  }
};

export const clearAllHistory = async (): Promise<
  { success: boolean } | { error: string }
> => {
  try {
    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Then delete all conversations
    await prisma.conversation.deleteMany({
      where: { userId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to clear chat history:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to clear chat history" };
  }
};

// Clear history older than specified date
export const clearHistoryOlderThan = async (
  olderThanDate: Date
): Promise<
  { deletedConversations: number; deletedMessages: number } | { error: string }
> => {
  try {
    // Validate input data
    const validatedData = ClearHistoryOlderThanSchema.parse({ olderThanDate });

    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get conversations to delete
    const conversationsToDelete = await prisma.conversation.findMany({
      where: {
        userId,
        createdAt: { lt: validatedData.olderThanDate },
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
        createdAt: { lt: validatedData.olderThanDate },
      },
    });

    return {
      deletedConversations: deletedConversations.count,
      deletedMessages: deletedMessages.count,
    };
  } catch (error) {
    console.error("Failed to clear old history:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to clear old history" };
  }
};

// Import chat history from formatted structure
export const importChatHistory = async (
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
  try {
    // Validate input data
    const validatedData = ImportChatHistorySchema.parse({ historyData, options });

    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Allow importing from different users when transferFromDifferentUser is true
    if (validatedData.historyData.userId !== userId && !validatedData.options.transferFromDifferentUser) {
      return {
        error:
          "History data belongs to a different user. Set transferFromDifferentUser option to import anyway.",
      };
    }
    let importedConversations = 0;
    let importedMessages = 0;
    let skippedConversations = 0;

    for (const conv of validatedData.historyData.conversations) {
      try {
        // Check if conversation already exists (only relevant for same-user imports)
        let existingConv = null;
        if (
          !validatedData.options.transferFromDifferentUser ||
          validatedData.historyData.userId === userId
        ) {
          existingConv = await prisma.conversation.findFirst({
            where: {
              userId,
              id: conv.id,
            },
          });

          if (existingConv && !validatedData.options.overwrite) {
            if (validatedData.options.skipExisting) {
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

        if (
          validatedData.options.transferFromDifferentUser &&
          validatedData.historyData.userId !== userId
        ) {
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
        if (existingConv && validatedData.options.overwrite) {
          await prisma.message.deleteMany({
            where: { conversationId: conv.id },
          });
        }

        // Import messages
        for (const msg of conv.messages) {
          if (
            validatedData.options.transferFromDifferentUser &&
            validatedData.historyData.userId !== userId
          ) {
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
        return {
          error: `Failed to import conversation "${conv.title}": ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        };
      }
    }

    return {
      importedConversations,
      importedMessages,
      skippedConversations,
    };
  } catch (error) {
    console.error("Failed to import chat history:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to import chat history" };
  }
};

// Delete specific conversation
export const deleteConversation = async (
  conversationId: string
): Promise<{ success: boolean } | { error: string }> => {
  try {
    // Validate conversation ID format
    const validatedData = DeleteConversationSchema.parse({ conversationId });

    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the conversation belongs to the user
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: validatedData.conversationId,
        userId,
      },
    });

    if (!conversation) {
      return { error: "Conversation not found or access denied" };
    }

    // Delete messages first
    await prisma.message.deleteMany({
      where: { conversationId: validatedData.conversationId },
    });

    // Delete conversation
    await prisma.conversation.delete({
      where: { id: validatedData.conversationId },
    });

    return { success: true };
  } catch (error) {
    console.error("Failed to delete conversation:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to delete conversation" };
  }
};

// Get conversations with pagination
export const getConversationsPaginated = async (
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
  try {
    // Validate and sanitize pagination options
    const validatedOptions = GetConversationsPaginatedSchema.parse(options);

    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    const whereClause = {
      userId,
      ...(validatedOptions.search && {
        title: {
          contains: validatedOptions.search,
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
        orderBy: { [validatedOptions.sortBy]: validatedOptions.sortOrder },
        take: validatedOptions.limit,
        skip: validatedOptions.offset,
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
      hasMore: validatedOptions.offset + validatedOptions.limit < total,
    };
  } catch (error) {
    console.error("Failed to get paginated conversations:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to retrieve conversations" };
  }
};

// Sync history between accounts (placeholder for future implementation)
export const prepareSyncData = async (): Promise<
  | {
      syncToken: string;
      lastSyncAt: string;
      historyHash: string;
    }
  | { error: string }
> => {
  try {
    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get basic info for sync preparation
    const stats = await getHistoryStats();

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
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to prepare sync data" };
  }
};
