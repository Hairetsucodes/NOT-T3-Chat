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
  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
  });
  if (!conversation) {
    throw new Error("Conversation not found");
  }
  
  if (conversation.branchedIds) {
    // This is a branched conversation - get messages from all conversations in the branch chain
    const branchedIds: string[] = JSON.parse(conversation.branchedIds);
    const allConversationIds = [...branchedIds, conversationId]; // Include current conversation too
    
    const allMessages = await prisma.message.findMany({
      where: {
        conversationId: {
          in: allConversationIds,
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });
    
    return allMessages;
  }

  // Regular conversation or original conversation
  const messages = await prisma.message.findMany({
    where: {
      conversationId,
    },
    orderBy: {
      createdAt: "asc",
    },
  });
  return messages;
};
