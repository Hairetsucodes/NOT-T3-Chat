"use server";
import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";
import { CreateMessageSchema, GetMessagesByConversationSchema } from "@/schemas/messages";

export const createMessage = async (
  content: string,
  role: string,
  provider: string,
  modelId: string,
  reasoningContent: string,
  conversationId?: string,
  title?: string
) => {
  try {
    // Validate and sanitize input data
    const validatedData = CreateMessageSchema.parse({
      content,
      role,
      provider,
      modelId,
      reasoningContent,
      conversationId,
      title,
    });

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    let finalConversationId = validatedData.conversationId;

    // Create conversation if it doesn't exist
    if (!finalConversationId) {
      const conversation = await prisma.conversation.create({
        data: {
          userId,
          title: validatedData.title || "New Conversation",
        },
      });
      finalConversationId = conversation.id;
    }

    // Create and return the message
    const message = await prisma.message.create({
      data: {
        userId,
        conversationId: finalConversationId,
        content: validatedData.content,
        role: validatedData.role,
        provider: validatedData.provider,
        model: validatedData.modelId,
        reasoningContent: validatedData.reasoningContent,
      },
    });

    return message;
  } catch (error) {
    console.error("Error creating message:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to create message");
  }
};

export const getConversations = async () => {
  try {
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
  } catch (error) {
    console.error("Error getting conversations:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to fetch conversations");
  }
};

export const getMessagesByConversationId = async (conversationId: string) => {
  try {
    // Validate conversation ID format
    const validatedData = GetMessagesByConversationSchema.parse({
      conversationId,
    });

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const conversation = await prisma.conversation.findFirst({
      where: {
        id: validatedData.conversationId,
        userId: userId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: validatedData.conversationId,
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
