"use server";
import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";
import { User } from "@prisma/client";
import { UpdateUserSchema, DeleteUserSchema } from "@/schemas/userInfo";

export const updateUser = async (data: Partial<User>) => {
  try {
    // Validate and sanitize input data
    const validatedData = UpdateUserSchema.parse(data);
    
    const { userId } = await checkUser();
    
    // Check if the username is already taken (only if username is being updated)
    if (validatedData.username) {
      const existingUser = await prisma.user.findUnique({
        where: { username: validatedData.username },
      });
      if (existingUser && existingUser.id !== userId) {
        return { error: "Username already taken" };
      }
    }

    // Check if the email is already taken (only if email is being updated)
    if (validatedData.email) {
      const existingUser = await prisma.user.findUnique({
        where: { email: validatedData.email },
      });
      if (existingUser && existingUser.id !== userId) {
        return { error: "Email already taken" };
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: validatedData,
    });

    return user;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred" };
  }
};

export const deleteUser = async (confirmationData?: { confirmation?: string }) => {
  try {
    // Validate confirmation data if provided
    if (confirmationData) {
      DeleteUserSchema.parse(confirmationData);
    }

    const { userId } = await checkUser();

    const user = await prisma.user.delete({
      where: { id: userId },
    });

    return user;
  } catch (error) {
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "An unexpected error occurred" };
  }
};
