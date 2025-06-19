"use server";
import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";
import { Conversation } from "@prisma/client";
import { GetSharedChatSchema, UpdateIsPublicSchema } from "@/schemas/conversations";

export const getSharedChat = async (id: string) => {
  try {
    // Validate conversation ID format
    const validatedData = GetSharedChatSchema.parse({ id });

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: validatedData.id,
        isPublic: true,
      },
      include: {
        Message: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!conversation) {
      return null;
    }

    const { Message: messages, ...conversationData } = conversation;
    return { messages, conversation: conversationData };
  } catch (error) {
    console.error("Error fetching shared chat:", error);
    return null;
  }
};

export const updateIsPublic = async (
  id: string,
  isPublic: boolean
): Promise<Conversation | { error: string }> => {
  try {
    // Validate input data
    const validatedData = UpdateIsPublicSchema.parse({ id, isPublic });

    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Verify the conversation belongs to the user before updating
    const existingConversation = await prisma.conversation.findFirst({
      where: {
        id: validatedData.id,
        userId: userId,
      },
    });

    if (!existingConversation) {
      return { error: "Conversation not found or unauthorized" };
    }

    const updatedConversation = await prisma.conversation.update({
      where: { id: validatedData.id },
      data: { isPublic: validatedData.isPublic },
    });

    return updatedConversation;
  } catch (error) {
    console.error(`Error updating isPublic for conversation ${id}:`, error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update conversation" };
  }
};
