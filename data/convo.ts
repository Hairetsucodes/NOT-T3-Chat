"use server";
import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";
import { BranchConversationSchema, CreateRetryConversationSchema, PinConversationSchema } from "@/schemas/convo";

export const branchConversation = async (conversationId: string) => {
  try {
    // Validate conversation ID format
    const validatedData = BranchConversationSchema.parse({ conversationId });

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: validatedData.conversationId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }
    
    const messages = await prisma.message.findMany({
      where: {
        conversationId: validatedData.conversationId,
      },
    });

    // Get all conversation IDs that should be included in the new branch
    let branchedIds: string[];

    if (conversation.branchedIds) {
      // This conversation already has a branch chain, include all of them plus this one
      const existingIds = JSON.parse(conversation.branchedIds);
      branchedIds = [...existingIds, validatedData.conversationId];
    } else {
      // This is the original conversation, just include this one
      branchedIds = [validatedData.conversationId];
    }

    const branchedConversation = await prisma.conversation.create({
      data: {
        userId,
        title: conversation.title,
        branchedFromConvoId: validatedData.conversationId,
        branchedIds: JSON.stringify(branchedIds),
      },
    });

    await prisma.message.createMany({
      data: messages.map((message) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...messageWithoutId } = message;
        return {
          ...messageWithoutId,
          conversationId: branchedConversation.id,
        };
      }),
    });

    return branchedConversation;
  } catch (error) {
    console.error("Error branching conversation:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to branch conversation");
  }
};

export const createRetryConversation = async (conversationId: string) => {
  try {
    // Validate conversation ID format
    const validatedData = CreateRetryConversationSchema.parse({ conversationId });

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: validatedData.conversationId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    const retryConversation = await prisma.conversation.create({
      data: {
        userId,
        title: conversation.title || " New Chat",
        isRetry: true,
      },
    });

    return retryConversation;
  } catch (error) {
    console.error("Error creating retry conversation:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to create retry conversation");
  }
};

export const pinConversation = async (conversationId: string) => {
  try {
    // Validate conversation ID format
    const validatedData = PinConversationSchema.parse({ conversationId });

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: validatedData.conversationId,
      },
    });

    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await prisma.conversation.update({
      where: { id: validatedData.conversationId },
      data: { isPinned: !conversation.isPinned },
    });
  } catch (error) {
    console.error("Error pinning conversation:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to pin conversation");
  }
};
