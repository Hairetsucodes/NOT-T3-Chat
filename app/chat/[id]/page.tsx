import { Chat } from "@/components/chat/Chat";
import { ChatServerProvider } from "@/context/ChatServerProvider";
import { getMessagesByConversationId } from "@/data/messages";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ provider?: string; model?: string }>;
}) {
  const { id } = await props.params;

  if (!id || id.length < 10) {
    notFound();
  }

  const messages = await getMessagesByConversationId(id);

  return (
    <ChatServerProvider conversationId={id} messages={messages || []}>
      <Chat welcomeMessage={false} />
    </ChatServerProvider>
  );
}
