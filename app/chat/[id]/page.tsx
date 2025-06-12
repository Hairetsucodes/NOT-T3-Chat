import React from "react";
import { getMessagesByConversationId } from "@/data/messages";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat/Chat";
import { ChatWrapper } from "@/components/chat/ChatWrapper";

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const dbMessages = await getMessagesByConversationId(params.id);
  if (!dbMessages) {
    redirect("/chat");
  }

  // Transform database messages to Message format, filtering out unsupported roles
  const messages = dbMessages
    .filter((msg) => ["user", "assistant", "system"].includes(msg.role))
    .map((msg) => ({
      id: msg.id,
      role: msg.role as "user" | "assistant" | "system",
      content: msg.content,
      provider: msg.provider,
      model: msg.model || undefined,
      reasoning_content: msg.reasoningContent || undefined,
    }));

  return (
    <ChatWrapper initialMessages={messages} initialConversationId={params.id}>
      <Chat />
    </ChatWrapper>
  );
}
