import { z } from "zod";

// Validation schemas for chat endpoint
const MessageSchema = z.object({
  role: z.enum(["user", "assistant", "system"]),
  content: z
    .string()
    .min(1, "Message content cannot be empty")
    .max(50000, "Message content too long"),
});

const SelectedModelSchema = z
  .object({
    provider: z.string().min(1, "Provider is required"),
    model: z.string().min(1, "Model is required"),
  })
  .optional();

export const ChatRequestSchema = z.object({
  messages: z
    .array(MessageSchema)
    .min(1, "At least one message is required")
    .max(100, "Too many messages"),
  conversationId: z.string().nullable().optional(),
  selectedModel: SelectedModelSchema,
});

export type ChatRequest = z.infer<typeof ChatRequestSchema>;
