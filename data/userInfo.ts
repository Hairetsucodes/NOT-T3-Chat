import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";

export const updateUser = async (data: Partial<User>) => {
  const { userId } = await checkUser();
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

export const deleteUser = async () => {
  const { userId } = await checkUser();

  const user = await prisma.user.delete({
    where: { id: userId },
  });

  return user;
};
