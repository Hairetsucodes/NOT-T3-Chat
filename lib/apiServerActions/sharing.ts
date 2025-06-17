import { prisma } from "@/prisma";

export const isShared = async (filename: string) => {
  const attachment = await prisma.attachment.findFirst({
    where: { filename, isShared: true },
  });
  return attachment !== null;
};
