"use server";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { getConversations, getMessagesByConversationId } from "@/data/messages";
import { ChatProvider } from "@/context/ChatContext";
import { getUserById } from "@/data/user";
import { getProviders } from "@/data/providers";
import { getAvailableModels, getPreferredModels } from "@/data/models";
import { getChatSettings, getUserSettings } from "@/data/settings";
import { transformDatabaseMessages } from "@/lib/utils/message-transform";

interface ChatServerProviderProps {
  children: React.ReactNode;
  /**
   * Optional conversation ID to load specific conversation messages.
   * 
   * - When provided: Loads the specific conversation messages as initial messages
   * - When not provided: Provides blank state (useful for new chats)
   */
  conversationId?: string;
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
   * // Full chat functionality with specific conversation (default)
   * <ChatServerProvider conversationId="conv123">
   *   <ChatInterface />
   * </ChatServerProvider>
   * 
   * // Blank chat state for new conversations
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
 * - Fetches specific conversation messages when `conversationId` is provided
 * - Fetches all required data in parallel for optimal performance
 * - Handles error cases and fallbacks gracefully
 */
export async function ChatServerProvider({ 
  children, 
  conversationId,
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

  // Prepare data loading promises
  const baseDataPromises = [
    getConversations(),
    getProviders(),
    getChatSettings(),
    getUserSettings(),
    getAvailableModels(),
    getPreferredModels(),
  ] as const;

  // Load base data first
  const [conversations, providers, chatSettings, userSettings, models, preferredModels] = 
    await Promise.all(baseDataPromises);
  
  // Transform and prepare initial messages if conversation was loaded
  let initialMessages: any[] | undefined = undefined;
  let initialConversationId: string | undefined = undefined;
  let needsClientSideLoading: string | undefined = undefined;
  
  if (conversationId) {
    try {
      const dbMessages = await getMessagesByConversationId(conversationId);
      
      // Check if this conversation is currently generating
      const conversation = conversations.find(conv => conv.id === conversationId);
      const isGenerating = conversation?.isGenerating;
      
      if (isGenerating) {
        // Don't prefetch messages for generating conversations
        // Let client-side setConversationId handle reconnection
        needsClientSideLoading = conversationId;
      } else if (dbMessages && dbMessages.length > 0) {
        // Only set initial messages if there are actual messages and not generating
        initialMessages = await transformDatabaseMessages(dbMessages);
        initialConversationId = conversationId;
      }
      // If no messages and not generating, let client-side handle it
    } catch (error) {
      console.error("Error loading conversation messages:", error);
      // Continue without initial messages if there's an error
    }
  }

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
      {...(initialMessages && { initialMessages })}
      {...(initialConversationId && { initialConversationId })}
      {...(needsClientSideLoading && { needsClientSideLoading })}
    >
      {children}
    </ChatProvider>
  );
} 