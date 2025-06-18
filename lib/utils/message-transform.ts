import { Message } from "@/types/chat";

// Database message type (from Prisma)
export type DatabaseMessage = {
  id: string;
  conversationId: string;
  userId: string;
  content: string;
  role: string;
  provider: string;
  model: string | null;
  reasoningContent: string | null;
  promptId: string | null;
  createdAt: Date;
  updatedAt: Date;
};

// Type guard for message roles
export function isValidMessageRole(
  role: string
): role is "user" | "assistant" | "system" {
  return ["user", "assistant", "system"].includes(role);
}

// Transform database messages to frontend message format
export async function transformDatabaseMessages(
  dbMessages: DatabaseMessage[]
): Promise<Message[]> {
  return dbMessages
    .filter((msg) => isValidMessageRole(msg.role))
    .map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
      provider: msg.provider,
      model: msg.model || undefined,
      reasoning_content: msg.reasoningContent || undefined,
    }));
}

// Validate message data integrity
export async function validateMessageData(
  dbMessages: DatabaseMessage[],
  transformedMessages: Message[]
): Promise<void> {
  if (dbMessages.length > 0 && transformedMessages.length === 0) {
    console.warn("All messages filtered out - possible data integrity issue");
  }

  const filteredCount = dbMessages.length - transformedMessages.length;
  if (filteredCount > 0) {
    console.warn(`${filteredCount} messages filtered out due to invalid roles`);
  }
}
