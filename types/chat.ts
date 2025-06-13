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
};

export interface MessageActionsProps {
  conversationId?: string;
  inputMessage: string;
  message: Message;
  selectedRetryModel?: string;
  selectedRetryProvider?: string;
}
