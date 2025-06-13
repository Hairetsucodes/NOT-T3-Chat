"use server";

import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";

export const updateUser = async (userId: string, data: Partial<User>) => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }
  // check if the username is already taken
  if (data.username) {
    const existingUser = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUser) {
      return { error: "Username already taken" };
    }
  }
  const user = await prisma.user.update({
    where: { id: userId },
    data,
  });

  return user;
};

export const deleteUser = async (userId: string) => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  const user = await prisma.user.delete({
    where: { id: userId },
  });

  return user;
};
