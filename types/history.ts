
// Types for formatted history export/import
export interface FormattedMessage {
    id: string;
    content: string;
    role: string;
    provider: string;
    model?: string | null;
    reasoningContent?: string | null;
    createdAt: string;
    updatedAt: string;
  }
  
  export interface FormattedConversation {
    id: string;
    title: string;
    createdAt: string;
    updatedAt: string;
    messages: FormattedMessage[];
    messageCount: number;
  }
  
  export interface UserChatHistory {
    userId: string;
    totalConversations: number;
    totalMessages: number;
    exportedAt: string;
    conversations: FormattedConversation[];
  }
  
  export interface HistoryStats {
    totalConversations: number;
    totalMessages: number;
    oldestConversation?: string;
    newestConversation?: string;
    providers: { [key: string]: number };
    messagesByRole: { [key: string]: number };
  }
  