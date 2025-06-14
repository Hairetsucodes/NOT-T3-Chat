"use server";
import { prisma } from "@/prisma";
import { checkUser } from "@/lib/auth/check";

export const getProviders = async () => {
  const { userId } = await checkUser();

  const providers = await prisma.apiKey.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      provider: true,
    },
  });
  return providers;
};
