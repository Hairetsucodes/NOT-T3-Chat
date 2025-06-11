import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getConversations } from "@/data/messages";
import { ChatProvider } from "@/context/ChatContext";
import { getUserById } from "@/data/user";
import { getProviders } from "@/data/apikeys";
import { getAvailableModels, getPreferredModels } from "@/data/models";
import { UnifiedModel } from "@/data/models";

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

  // Only fetch models if OpenRouter is available
  let models: UnifiedModel[] = [];
  if (providers.map((p) => p.toLowerCase()).includes("openrouter")) {
    models = await getAvailableModels();
  }
  const preferredModels = await getPreferredModels(user.user.id);

  return (
    <ChatProvider
      activeUser={userData}
      initialConversations={conversations}
      activeProviders={providers}
      currentProvider={providers[0] || null}
      availableModels={models}
      preferredModels={preferredModels}
    >
      <div className="">{children}</div>
    </ChatProvider>
  );
}
