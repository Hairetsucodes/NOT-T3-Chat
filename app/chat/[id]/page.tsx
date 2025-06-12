import React from "react";
import { getMessagesByConversationId } from "@/data/messages";
import { Chat } from "@/components/chat/Chat";
import { ChatWrapper } from "@/components/chat/ChatWrapper";
import { redirect } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ provider?: string; model?: string }>;
}) {
  const { id } = await props.params;

  const { provider, model } = await props.searchParams;
  const dbMessages = await getMessagesByConversationId(id);
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
