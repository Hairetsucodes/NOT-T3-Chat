"use server";
import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";

export const createMessage = async (
  content: string,
  role: string,
  provider: string,
  modelId: string,
  reasoningContent: string,
  conversationId?: string,
  title?: string
) => {
  const { userId } = await checkUser();
  if (!userId) {
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

export const getConversations = async () => {
  const { userId } = await checkUser();
  if (!userId) {
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
  const { userId } = await checkUser();
  try {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        userId: userId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
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
    // Re-throw specific errors to maintain error handling in the page
    if (
      error instanceof Error &&
      (error.message === "Conversation not found" ||
        error.message === "Unauthorized")
    ) {
      throw error;
    }
    // For other errors, throw a generic error
    throw new Error("Failed to fetch messages");
  }
};
