import React from "react";
import type { Metadata } from "next";
import { getMessagesByConversationId } from "@/data/messages";
import { redirect } from "next/navigation";
import { Chat } from "@/components/chat/Chat";

export const metadata: Metadata = {
  title: "Job Search",
  description: "Find your dream job on Hiring.fm",
};

export default async function Page(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;

  const dbMessages = await getMessagesByConversationId(params.id);
  if (!dbMessages) {
    redirect("/chat");
  }

  // Transform database messages to AI SDK Message format
  const messages = dbMessages.map(msg => ({
    id: msg.id,
    role: msg.role as "user" | "assistant" | "system" | "data",
    content: msg.content,
  }));

  return <Chat messages={messages} conversationId={params.id} />;
}
