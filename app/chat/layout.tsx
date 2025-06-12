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
  const userData = await getUserById(user.user.id);

  // Handle error case or null response
  if (!userData || "error" in userData) {
    redirect("/");
  }
  const conversations = await getConversations(user.user.id);
  const providers = await getProviders(user.user.id);
  const chatSettings = await getChatSettings(user.user.id);
  const userSettings = await getUserSettings(user.user.id);
  let models: UnifiedModel[] = [];
  if (providers.length > 0) {
    models = await getAvailableModels();
  }
  const preferredModels = await getPreferredModels(user.user.id);
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
