"use server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getConversations } from "@/data/messages";
import { ChatProvider } from "@/context/ChatContext";
import { getUserById } from "@/data/user";
import { getProviders } from "@/data/apikeys";
import { getAvailableModels, getPreferredModels } from "@/data/models";
import { UnifiedModel } from "@/data/models";
import { getChatSettings, getUserSettings } from "@/data/settings";

export default async function ChatLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const user = await auth();
  if (!user) {
    redirect("/");
  }
  const userData = await getUserById();

  // Handle error case or null response
  if (!userData || "error" in userData) {
    redirect("/");
  }
  const conversations = await getConversations();
  const providers = await getProviders();
  const chatSettings = await getChatSettings();
  const userSettings = await getUserSettings();
  let models: UnifiedModel[] = [];
  if (providers.length > 0) {
    models = await getAvailableModels();
  }
  const preferredModels = await getPreferredModels();
  return (
    <ChatProvider
      activeUser={userData}
      initialUserSettings={
        userSettings && "error" in userSettings ? null : userSettings
      }
      initialConversations={conversations}
      initialActiveProviders={providers}
      currentProvider={providers[0]?.provider || null}
      availableModels={models}
      preferredModels={preferredModels}
      initialChatSettings={
        chatSettings && "error" in chatSettings ? null : chatSettings
      }
    >
      <div className="">{children}</div>
    </ChatProvider>
  );
}
