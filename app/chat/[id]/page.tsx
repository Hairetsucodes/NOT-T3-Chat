import { Chat } from "@/components/chat/Chat";
import { ChatServerProvider } from "@/context/ChatServerProvider";
import { redirect, notFound } from "next/navigation";
import { auth } from "@/auth";

export default async function Page(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ provider?: string; model?: string }>;
}) {
  const { id } = await props.params;

  if (!id || id.length < 10) {
    notFound();
  }

  const session = await auth();
  if (!session?.user?.id) {
    redirect("/");
  }

  return (
    <ChatServerProvider conversationId={id}>
      <Chat welcomeMessage={false} />
    </ChatServerProvider>
  );
}
