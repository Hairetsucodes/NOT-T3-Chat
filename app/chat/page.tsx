import { Chat } from "@/components/chat/Chat";

export const dynamic = "force-dynamic";

export default function Page() {
  return <Chat welcomeMessage={true} />;
}
