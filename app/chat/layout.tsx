import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getConversations } from "@/data/messages";
import { ChatProvider } from "@/context/ChatContext";
import { getUserById } from "@/data/user";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await auth();
  if (!user) {
    redirect("/");
  }
  const userData = await getUserById(user.user.id);

  // Handle error case or null response
  if (!userData || "error" in userData) {
    redirect("/");
  }

  const conversations = await getConversations(user.user.id);
  return (
    <ChatProvider activeUser={userData} initialConversations={conversations}>
      <div className="">{children}</div>
    </ChatProvider>
  );
}
