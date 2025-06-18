import {
  Conversation,
  UserCustomization,
  ChatSettings,
  PreferredModel,
} from "@prisma/client";
import { UnifiedModel } from "@/types/models";
import { SUPPORTED_PROVIDERS } from "@/constants/supportedProviders";

// Type definitions for chat message content
export interface TextContentPart {
  type: "text";
  text: string;
}

export type Message = {
  id?: string;
  role: "user" | "assistant" | "system";
  content: string;
  reasoning_content?: string;
  timestamp?: Date;
  conversationId?: string;
  provider?: string;
  model?: string;
  image_url?: string;
  partial_image?: string;
  image_generation_status?: string;
  previous_response_id?: string;
};

export interface MessageActionsProps {
  conversationId?: string;
  inputMessage: string;
  message: Message;
  selectedRetryModel?: string;
  selectedRetryProvider?: string;
}

export type ChatUser = {
  name: string | null;
  id: string;
  username: string | null;
  email: string | null;
  image: string | null;
} | null;

// Extend Conversation type to include loading state
export type ConversationWithLoading = Conversation & {
  isLoading?: boolean;
  isRetry?: boolean;
};

export interface ChatContextType {
  conversations: ConversationWithLoading[];
  pinnedConversations: ConversationWithLoading[];
  unpinnedConversations: ConversationWithLoading[];
  setConversations: (conversations: ConversationWithLoading[]) => void;
  addConversation: (conversation: ConversationWithLoading) => void;
  updateConversation: (
    id: string,
    updates: Partial<ConversationWithLoading>
  ) => void;
  removeLoadingConversation: (id: string) => void;
  togglePinConversation: (id: string) => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  activeUser: ChatUser;
  userSettings: UserCustomization | null;
  chatSettings: ChatSettings | null;
  setChatSettings: (settings: ChatSettings) => void;
  setUserSettings: (settings: UserCustomization) => void;
  filteredModels: UnifiedModel[];
  setFilteredModels: (models: UnifiedModel[]) => void;
  activeProviders: {
    id: string;
    provider: string;
  }[];
  setActiveProviders: (
    providers: {
      id: string;
      provider: string;
    }[]
  ) => void;
  availableModels: UnifiedModel[];
  preferredModels: PreferredModel[];
  setPreferredModels: (models: PreferredModel[]) => void;
  refreshPreferredModels: () => Promise<void>;
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  input: string;
  setInput: (input: string) => void;
  isLoading: boolean;
  conversationId: string | null;
  setConversationId: (id: string | null) => void;
  conversationTitle: string | null;
  setConversationTitle: (title: string | null) => void;
  sendMessage: (
    message: Message,
    options?: {
      conversationId?: string;
      selectedModel?: string;
      provider?: string;
      model?: string;
      retry?: boolean;
    }
  ) => Promise<void>;
  handleInputChange: (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => void;
  handleSubmit: (event?: {
    preventDefault?: () => void;
    currentInput?: string;
  }) => void;
  handleSuggestionSelect: (suggestion: string) => void;
}

//API Types
// Types
export interface APIMessage {
  role: string;
  content: string;
}

export interface APISelectedModel {
  provider: string;
  model: string;
}
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];
