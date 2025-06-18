import { Chat } from "@/components/chat/Chat";
import { NewChatWrapper } from "@/components/chat/NewChatWrapper";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Chat welcomeMessage={true} />;
}
