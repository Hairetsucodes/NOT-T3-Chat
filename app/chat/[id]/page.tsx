import React from "react";
import { getMessagesByConversationId } from "@/data/messages";
import { Chat } from "@/components/chat/Chat";
import { ChatWrapper } from "@/components/chat/ChatWrapper";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";
import {
  transformDatabaseMessages,
  validateMessageData,
} from "@/lib/utils/message-transform";

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ provider?: string; model?: string }>;
}) {
  const { id } = await props.params;

  // Validate conversation ID format (basic check)
  if (!id || id.length < 10) {
    notFound();
  }

  // Check authentication first
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  const { provider, model } = await props.searchParams;

  let dbMessages;
  try {
    dbMessages = await getMessagesByConversationId(id);
  } catch (error) {
    console.error("Error fetching messages:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        redirect("/chat");
      }
      if (error.message === "Conversation not found") {
        notFound();
      }
    }

    // Generic error fallback
    redirect("/chat");
  }

  // Handle null response (shouldn't happen with proper error handling above, but defensive)
  if (!dbMessages) {
    redirect("/chat");
  }

  // Transform messages with proper type safety
  const messages = transformDatabaseMessages(dbMessages);

  // Validate data integrity
  validateMessageData(dbMessages, messages);

  return (
    <ChatWrapper
      initialMessages={messages}
      initialConversationId={id}
      initialProvider={provider || ""}
      initialModel={model || ""}
    >
      <Chat />
    </ChatWrapper>
  );
}
