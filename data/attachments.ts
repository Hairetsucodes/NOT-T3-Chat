"use server";
import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";

export const getAttachments = async () => {
  const { userId } = await checkUser();
  if (!userId) {
    throw new Error("Unauthorized");
  }

  const attachments = await prisma.attachment.findMany({
    where: {
      userId,
    },
  });

  return attachments;
};
