"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";

export const createUser = async (
  email: string,
  hashedPassword: string,
  name: string,
  username: string
) => {
  try {
    type UserCreateInput = {
      email: string;
      password: string;
      name: string;
      username: string;
    };
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        name,
      } as UserCreateInput,
    });

    return newUser;
  } catch (e) {
    console.error("Error creating user:", e);
    if (e instanceof Error) {
      console.error("Error message:", e.message);
      console.error("Error stack:", e.stack);
    }
    return null;
  }
};

export const getUserByEmail = async (email: string) => {
  if (!email) {
    return null;
  }

  try {
    const user = await prisma.user.findUnique({
      where: {
        email: email,
      },
    });

    return user;
  } catch (error) {
    console.error("Error in getUserByEmail:");
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    } else {
      console.error("Unknown error:", error);
    }
    throw error; // Re-throw the error to be handled by the auth logic
  }
};

export const getUserById = async () => {
  const session = await auth();
  if (!session?.user.id) {
    return { error: "Unauthorized" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session?.user.id },
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        image: true,
      },
    });
    if (!user) return { error: "User not found" };

    return {
      name: user?.name,
      id: user?.id,
      username: user?.username,
      email: user?.email,
      image: user?.image,
    };
  } catch (error) {
    // Log the error stack instead of the error object directly
    if (error instanceof Error) {
      console.error("Error in user creation process - Stack:", error.stack);
      throw new Error(`Failed to create user: ${error.message}`);
    } else {
      console.error("Unknown error in user creation process");
      throw new Error("Failed to create user: Unknown error");
    }
    return null;
  }
};
