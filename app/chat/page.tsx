"use server";
import { Chat } from "@/components/chat/Chat";
import { ChatServerProvider } from "@/context/ChatServerProvider";

export default async function Page() {
  return (
    <ChatServerProvider>
      <Chat welcomeMessage={true} />
    </ChatServerProvider>
  );
}
