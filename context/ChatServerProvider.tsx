"use server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getConversations } from "@/data/messages";
import { ChatProvider } from "@/context/ChatContext";
import { getUserById } from "@/data/user";
import { getProviders } from "@/data/providers";
import { getAvailableModels, getPreferredModels } from "@/data/models";
import { getChatSettings, getUserSettings } from "@/data/settings";

interface ChatServerProviderProps {
  children: React.ReactNode;
  /**
   * Controls whether to load all initial data or just authenticate.
   * 
   * - `true` (default): Loads all chat data (conversations, models, settings, etc.)
   *   Use this for full chat functionality where you need immediate access to all data.
   * 
   * - `false`: Only authenticates user and provides minimal context.
   *   Use this for pages that might not need full chat functionality immediately,
   *   or where you want to load data on-demand for better performance.
   * 
   * @example
   * ```tsx
   * // Full chat functionality (default)
   * <ChatServerProvider>
   *   <ChatInterface />
   * </ChatServerProvider>
   * 
   * // Minimal setup, load data on-demand
   * <ChatServerProvider loadInitialData={false}>
   *   <SettingsPage />
   * </ChatServerProvider>
   * ```
   */
  loadInitialData?: boolean;
}

/**
 * Server component that handles authentication and optional data fetching for chat functionality.
 * 
 * This component wraps the client-side ChatProvider and handles all server-side data fetching
 * operations. It provides a clean separation between server-side data loading and client-side
 * state management.
 * 
 * Features:
 * - Always handles user authentication and redirects
 * - Conditionally loads initial data based on `loadInitialData` prop
 * - Fetches all required data in parallel for optimal performance
 * - Handles error cases and fallbacks gracefully
 */
export async function ChatServerProvider({ 
  children, 
  loadInitialData = true 
}: ChatServerProviderProps) {
  // Always authenticate first - this is required for all chat functionality
  const user = await auth();
  if (!user) {
    redirect("/");
  }
  
  const userData = await getUserById();

  // Handle error case or null response
  if (!userData || "error" in userData) {
    redirect("/");
  }

  // If we don't need to load initial data, just provide the authenticated user
  // This is useful for pages that don't immediately need full chat context
  if (!loadInitialData) {
    return (
      <ChatProvider activeUser={userData}>
        {children}
      </ChatProvider>
    );
  }

  // Load all initial data in parallel for better performance
  // This provides full chat functionality from the start
  const [conversations, providers, chatSettings, userSettings, models, preferredModels] = 
    await Promise.all([
      getConversations(),
      getProviders(),
      getChatSettings(),
      getUserSettings(),
      getAvailableModels(),
      getPreferredModels(),
    ]);

  return (
    <ChatProvider
      activeUser={userData}
      initialUserSettings={
        userSettings && "error" in userSettings ? null : userSettings
      }
      initialConversations={conversations}
      initialActiveProviders={providers}
      availableModels={models}
      preferredModels={preferredModels}
      initialChatSettings={
        chatSettings && "error" in chatSettings ? null : chatSettings
      }
    >
      {children}
    </ChatProvider>
  );
} 