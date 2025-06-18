import { Chat } from "@/components/chat/Chat";
import { ChatServerProvider } from "@/context/ChatServerProvider";

export const dynamic = "force-dynamic";

export default function Page() {
  return (
    <ChatServerProvider>
      <Chat welcomeMessage={true} />
    </ChatServerProvider>
  );
}
