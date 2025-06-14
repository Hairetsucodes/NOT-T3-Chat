"use server";
import { prisma } from "@/prisma";
import { checkUser } from "@/lib/auth/check";

export async function getSharedChat(id: string) {
  const conversation = await prisma.conversation.findUnique({
    where: {
      id,
      isPublic: true,
    },
  });
  if (!conversation) {
    return null;
  }
  const messages = await prisma.message.findMany({
    where: {
      conversationId: conversation.id,
    },
  });

  return { conversation, messages };
}

export async function updateIsPublic(id: string, isPublic: boolean) {
  const { userId } = await checkUser();
  await prisma.conversation.update({
    where: { id, userId },
    data: { isPublic },
  });
}
