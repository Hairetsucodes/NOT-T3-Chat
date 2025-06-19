"use server";
import * as z from "zod";
import { RegisterSchema } from "@/schemas/register";
import bcrypt from "bcryptjs";
import { createUser, getUserByEmail } from "@/data/user";

export const register = async (values: z.infer<typeof RegisterSchema>) => {
  const validateFields = RegisterSchema.safeParse(values) as {
    success: boolean;
    data: { email: string; password: string; name: string; username: string };
  };
  if (!validateFields.success) {
    return { error: "Invalid fields" };
  }
  const { email, password, name } = validateFields.data;
  const hashedPassword = await bcrypt.hash(password, 10);
  // Save user to database
  const existingUser = await getUserByEmail(email);
  if (existingUser) {
    return { error: "User already exists" };
  }
  await createUser(email, hashedPassword, name);
  return { success: "User created successfully" };
};
