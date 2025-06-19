import { z } from "zod";

// Schema for updating user profile information
export const UpdateUserSchema = z.object({
  name: z
    .string()
    .min(1, "Name cannot be empty")
    .max(100, "Name is too long")
    .trim()
    .optional(),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username is too long")
    .regex(/^[a-zA-Z0-9_-]+$/, "Username can only contain letters, numbers, underscores, and hyphens")
    .trim()
    .optional(),
  email: z
    .string()
    .email("Invalid email address")
    .max(254, "Email is too long")
    .toLowerCase()
    .trim()
    .optional(),
  image: z
    .string()
    .url("Invalid image URL")
    .max(500, "Image URL is too long")
    .trim()
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one field must be provided for update",
  }
);

// Schema for delete user confirmation (future-proofing)
export const DeleteUserSchema = z.object({
  confirmation: z
    .string()
    .min(1, "Confirmation is required")
    .optional(),
});

// Type exports for TypeScript
export type UpdateUserRequest = z.infer<typeof UpdateUserSchema>;
export type DeleteUserRequest = z.infer<typeof DeleteUserSchema>; 