"use server";
import { prisma } from "@/prisma";
import { Conversation } from "@prisma/client";

export const getSharedChat = async (id: string) => {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: {
        id: id,
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
    const updatedConversation = await prisma.conversation.update({
      where: { id },
      data: { isPublic },
    });
    return updatedConversation;
  } catch (error) {
    console.error(`Error updating isPublic for conversation ${id}:`, error);
    return { error: "Failed to update conversation" };
  }
};
