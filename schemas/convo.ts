import { z } from "zod";

// Schema for branching a conversation
export const BranchConversationSchema = z.object({
  conversationId: z
    .string()
    .cuid("Invalid conversation ID format"),
});

// Schema for creating a retry conversation
export const CreateRetryConversationSchema = z.object({
  conversationId: z
    .string()
    .cuid("Invalid conversation ID format"),
});

// Schema for pinning/unpinning a conversation
export const PinConversationSchema = z.object({
  conversationId: z
    .string()
    .cuid("Invalid conversation ID format"),
});

// Type exports for TypeScript
export type BranchConversationRequest = z.infer<typeof BranchConversationSchema>;
export type CreateRetryConversationRequest = z.infer<typeof CreateRetryConversationSchema>;
export type PinConversationRequest = z.infer<typeof PinConversationSchema>; 