"use server";
import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";

export const branchConversation = async (
  userId: string,
  conversationId: string
) => {
  const user = await checkUser({ userId });
  if (!user) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }

  // Get all conversation IDs that should be included in the new branch
  let branchedIds: string[];

  if (conversation.branchedIds) {
    // This conversation already has a branch chain, include all of them plus this one
    const existingIds = JSON.parse(conversation.branchedIds);
    branchedIds = [...existingIds, conversationId];
  } else {
    // This is the original conversation, just include this one
    branchedIds = [conversationId];
  }

  const branchedConversation = await prisma.conversation.create({
    data: {
      userId,
      title: conversation.title,
      branchedFromConvoId: conversationId,
      branchedIds: JSON.stringify(branchedIds),
    },
  });

  return branchedConversation;
};

export const createRetryConversation = async (
  userId: string,
  originalTitle: string,
  conversationId: string
) => {
  const user = await checkUser({ userId });
  if (!user) {
    throw new Error("Unauthorized");
  }

  const conversation = await prisma.conversation.findUnique({
    where: {
      id: conversationId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }
  let allConversationIds: string[] | null;
  if (conversation.branchedIds) {
    const branchedIds = JSON.parse(conversation.branchedIds);
    allConversationIds = [...branchedIds, conversationId];
  } else {
    allConversationIds = null;
  }

  const retryConversation = await prisma.conversation.create({
    data: {
      userId,
      title: `${originalTitle.slice(0, 50)}` || " New Chat",
      branchedIds: allConversationIds
        ? JSON.stringify(allConversationIds)
        : null,
    },
  });

  return retryConversation;
};
