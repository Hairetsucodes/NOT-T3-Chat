"use server";
import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";

export const createMessage = async (
  userId: string,
  content: string,
  role: string,
  provider: string,
  modelId: string,
  reasoningContent: string,
  conversationId?: string,
  title?: string
) => {
  const user = await checkUser({ userId });
  if (!user) {
    throw new Error("Unauthorized");
  }

  // Create conversation if it doesn't exist
  if (!conversationId) {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || "New Conversation",
      },
    });
    conversationId = conversation.id;
  }

  // Validate required fields
  if (!content) {
    throw new Error("Content is required");
  }
  if (!role) {
    throw new Error("Role is required");
  }

  // Create and return the message
  const message = await prisma.message.create({
    data: {
      userId,
      conversationId,
      content,
      role,
      provider,
      model: modelId,
      reasoningContent,
    },
  });

  return message;
};

export const getConversations = async (userId: string) => {
  const user = await checkUser({ userId });
  if (!user) {
    throw new Error("Unauthorized");
  }
  const conversations = await prisma.conversation.findMany({
    where: {
      userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
  return conversations;
};

export const getMessagesByConversationId = async (conversationId: string) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId,
      },
    });
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    // Check if this is a branched conversation
    if (conversation.branchedIds && conversation.branchedIds !== "null") {
      const branchedIds: string[] = JSON.parse(conversation.branchedIds);
      const originalConversationIds = Array.isArray(branchedIds)
        ? branchedIds
        : [];

      const branchPoint = conversation.createdAt;

      // Get messages from original conversations that were created BEFORE the branch point
      let originalMessages: Awaited<
        ReturnType<typeof prisma.message.findMany>
      > = [];
      if (originalConversationIds.length > 0) {
        originalMessages = await prisma.message.findMany({
          where: {
            conversationId: {
              in: originalConversationIds,
            },
            createdAt: {
              lt: branchPoint,
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        });
      }

      // Get all messages from the current branched conversation
      const currentMessages = await prisma.message.findMany({
        where: {
          conversationId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      // Combine messages
      const allMessages = [...originalMessages, ...currentMessages];

      // CRITICAL VALIDATION: Double-check that no messages from original conversations are after branch point
      const invalidOriginalMessages = allMessages.filter(
        (msg) =>
          originalConversationIds.includes(msg.conversationId) &&
          msg.createdAt >= branchPoint
      );

      if (invalidOriginalMessages.length > 0) {
        console.error(
          `\n🚨 CRITICAL ERROR: Found ${invalidOriginalMessages.length} messages from original conversations created AFTER branch point!`
        );
        invalidOriginalMessages.forEach((msg) => {
          console.error(
            `  - Message ${msg.id} from conversation ${
              msg.conversationId
            } created at ${msg.createdAt.toISOString()} (AFTER branch at ${branchPoint.toISOString()})`
          );
        });

        // Filter them out completely
        const filteredMessages = allMessages.filter(
          (msg) =>
            !(
              originalConversationIds.includes(msg.conversationId) &&
              msg.createdAt >= branchPoint
            )
        );

        return filteredMessages.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
      }

      // Sort by creation time
      const sortedMessages = allMessages.sort(
        (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
      );

      return sortedMessages;
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return messages;
  } catch (error) {
    console.error("Error getting messages by conversation ID:", error);
    return null;
  }
};
