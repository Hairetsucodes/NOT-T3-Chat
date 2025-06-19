import { z } from "zod";

// Schema for clearing history older than a specific date
export const ClearHistoryOlderThanSchema = z.object({
  olderThanDate: z
    .date({
      required_error: "Date is required",
      invalid_type_error: "Invalid date format",
    })
    .refine((date) => date <= new Date(), {
      message: "Date cannot be in the future",
    }),
});

// Schema for deleting a specific conversation
export const DeleteConversationSchema = z.object({
  conversationId: z
    .string()
    .cuid("Invalid conversation ID format"),
});

// Schema for pagination options
export const GetConversationsPaginatedSchema = z.object({
  limit: z
    .number()
    .int("Limit must be an integer")
    .min(1, "Limit must be at least 1")
    .max(100, "Limit cannot exceed 100")
    .default(20),
  offset: z
    .number()
    .int("Offset must be an integer")
    .min(0, "Offset cannot be negative")
    .default(0),
  search: z
    .string()
    .max(200, "Search query is too long")
    .trim()
    .default(""),
  sortBy: z
    .enum(["createdAt", "updatedAt", "title"], {
      errorMap: () => ({ message: "Sort field must be createdAt, updatedAt, or title" }),
    })
    .default("updatedAt"),
  sortOrder: z
    .enum(["asc", "desc"], {
      errorMap: () => ({ message: "Sort order must be asc or desc" }),
    })
    .default("desc"),
});

// Schema for import options
export const ImportOptionsSchema = z.object({
  overwrite: z.boolean().default(false),
  skipExisting: z.boolean().default(false),
  transferFromDifferentUser: z.boolean().default(false),
});

// Schema for message structure in import data
const ImportMessageSchema = z.object({
  id: z.string().cuid("Invalid message ID format"),
  content: z
    .string()
    .min(1, "Message content cannot be empty")
    .max(50000, "Message content is too long"),
  role: z.enum(["user", "assistant", "system"]),
  provider: z
    .string()
    .min(1, "Provider is required")
    .max(50, "Provider name is too long"),
  model: z
    .string()
    .max(100, "Model name is too long")
    .nullable(),
  reasoningContent: z
    .string()
    .max(100000, "Reasoning content is too long")
    .nullable(),
  createdAt: z
    .string()
    .datetime("Invalid date format"),
  updatedAt: z
    .string()
    .datetime("Invalid date format"),
});

// Schema for conversation structure in import data
const ImportConversationSchema = z.object({
  id: z.string().cuid("Invalid conversation ID format"),
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title is too long"),
  createdAt: z
    .string()
    .datetime("Invalid date format"),
  updatedAt: z
    .string()
    .datetime("Invalid date format"),
  messageCount: z
    .number()
    .int("Message count must be an integer")
    .min(0, "Message count cannot be negative"),
  messages: z.array(ImportMessageSchema),
});

// Schema for import chat history data
export const ImportChatHistorySchema = z.object({
  historyData: z.object({
    userId: z.string().cuid("Invalid user ID format"),
    totalConversations: z
      .number()
      .int("Total conversations must be an integer")
      .min(0, "Total conversations cannot be negative"),
    totalMessages: z
      .number()
      .int("Total messages must be an integer")
      .min(0, "Total messages cannot be negative"),
    exportedAt: z
      .string()
      .datetime("Invalid export date format"),
    conversations: z.array(ImportConversationSchema),
  }),
  options: ImportOptionsSchema.default({}),
});

// Type exports for TypeScript
export type ClearHistoryOlderThanRequest = z.infer<typeof ClearHistoryOlderThanSchema>;
export type DeleteConversationRequest = z.infer<typeof DeleteConversationSchema>;
export type GetConversationsPaginatedRequest = z.infer<typeof GetConversationsPaginatedSchema>;
export type ImportChatHistoryRequest = z.infer<typeof ImportChatHistorySchema>;
export type ImportOptionsRequest = z.infer<typeof ImportOptionsSchema>; 