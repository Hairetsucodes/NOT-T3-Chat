"use server";
import { ChatServerProvider } from "@/context/ChatServerProvider";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ChatServerProvider>
      <div className="">{children}</div>
    </ChatServerProvider>
  );
}
