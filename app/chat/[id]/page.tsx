import { Chat } from "@/components/chat/Chat";
import { ChatServerProvider } from "@/context/ChatServerProvider";
import { notFound } from "next/navigation";

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ provider?: string; model?: string }>;
}) {
  const { id } = await props.params;

  if (!id || id.length < 10) {
    notFound();
  }

  return (
    <ChatServerProvider conversationId={id}>
      <Chat welcomeMessage={false} />
    </ChatServerProvider>
  );
}
