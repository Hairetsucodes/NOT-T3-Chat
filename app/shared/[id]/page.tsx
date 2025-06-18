"use server";

import React from "react";
import { notFound } from "next/navigation";
import { getSharedChat } from "@/data/conversations";
import SharedChat from "@/components/chat/Shared";
import { transformDatabaseMessages } from "@/lib/utils/message-transform";

export default async function SharedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const chatData = await getSharedChat(id);

  if (!chatData) {
    return notFound();
  }

  const { messages: dbMessages } = chatData;

  const messages = await transformDatabaseMessages(dbMessages);

  return <SharedChat messages={messages} />;
}
