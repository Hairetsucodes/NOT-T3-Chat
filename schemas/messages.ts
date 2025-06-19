import { z } from "zod";

// Schema for creating a new message
export const CreateMessageSchema = z.object({
  content: z
    .string()
    .min(1, "Message content cannot be empty")
    .max(50000, "Message content is too long")
    .trim(),
  role: z
    .enum(["user", "assistant", "system"], {
      errorMap: () => ({ message: "Role must be user, assistant, or system" }),
    }),
  provider: z
    .string()
    .min(1, "Provider is required")
    .max(50, "Provider name is too long")
    .trim(),
  modelId: z
    .string()
    .min(1, "Model ID is required")
    .max(100, "Model ID is too long")
    .trim()
    .optional(),
  reasoningContent: z
    .string()
    .max(100000, "Reasoning content is too long")
    .trim()
    .optional(),
  conversationId: z
    .string()
    .cuid("Invalid conversation ID format")
    .optional(),
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title is too long")
    .trim()
    .optional(),
});

// Schema for getting messages by conversation ID
export const GetMessagesByConversationSchema = z.object({
  conversationId: z
    .string()
    .cuid("Invalid conversation ID format"),
});

// Type exports for TypeScript
export type CreateMessageRequest = z.infer<typeof CreateMessageSchema>;
export type GetMessagesByConversationRequest = z.infer<typeof GetMessagesByConversationSchema>; 