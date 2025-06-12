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

  const branchedConversation = await prisma.conversation.create({
    data: {
      userId,
      title: conversation.title,
      branchedFromConvoId: conversationId,
    },
  });

  if (!conversation) {
    throw new Error("Conversation not found");
  }
  console.log("branchedConversation", branchedConversation);
  return branchedConversation;
};
