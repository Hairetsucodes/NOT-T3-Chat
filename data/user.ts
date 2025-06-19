"use server";

import { auth } from "@/auth";
import { prisma } from "@/prisma";
import { CreateUserSchema, GetUserByEmailSchema } from "@/schemas/user";

export const createUser = async (
  email: string,
  hashedPassword: string,
  name: string,
) => {
  try {
    // Validate and sanitize input data
    const validatedData = CreateUserSchema.parse({
      email,
      hashedPassword,
      name,
    });

    type UserCreateInput = {
      email: string;
      password: string;
      name: string;
      username: string;
    };
    
    const newUser = await prisma.user.create({
      data: {
        email: validatedData.email,
        password: validatedData.hashedPassword,
        name: validatedData.name,
      } as UserCreateInput,
    });

    return newUser;
  } catch (e) {
    console.error("Error creating user:", e);
    if (e instanceof Error) {
      throw new Error(e.message);
    }
    throw new Error("Failed to create user");
  }
};

export const getUserByEmail = async (email: string) => {
  try {
    // Validate and sanitize input data
    const validatedData = GetUserByEmailSchema.parse({ email });

    const user = await prisma.user.findUnique({
      where: {
        email: validatedData.email,
      },
    });

    return user;
  } catch (error) {
    console.error("Error in getUserByEmail:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to get user by email");
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
