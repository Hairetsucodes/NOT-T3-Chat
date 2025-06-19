import { z } from "zod";

// Schema for getting a shared chat
export const GetSharedChatSchema = z.object({
  id: z
    .string()
    .cuid("Invalid conversation ID format"),
});

// Schema for updating isPublic status
export const UpdateIsPublicSchema = z.object({
  id: z
    .string()
    .cuid("Invalid conversation ID format"),
  isPublic: z
    .boolean({
      required_error: "isPublic is required",
      invalid_type_error: "isPublic must be a boolean",
    }),
});

// Type exports for TypeScript
export type GetSharedChatRequest = z.infer<typeof GetSharedChatSchema>;
export type UpdateIsPublicRequest = z.infer<typeof UpdateIsPublicSchema>; 