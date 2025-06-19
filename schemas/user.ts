import { z } from "zod";

// Schema for creating a new user
export const CreateUserSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim(),
  hashedPassword: z
    .string()
    .min(1, "Password hash is required"),
  name: z
    .string()
    .min(1, "Name is required")
    .max(100, "Name is too long")
    .trim(),
});

// Schema for getting user by email
export const GetUserByEmailSchema = z.object({
  email: z
    .string()
    .email("Invalid email address")
    .toLowerCase()
    .trim(),
});

// Type exports for TypeScript
export type CreateUserRequest = z.infer<typeof CreateUserSchema>;
export type GetUserByEmailRequest = z.infer<typeof GetUserByEmailSchema>; 