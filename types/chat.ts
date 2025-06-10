// Type definitions for chat message content
export interface TextContentPart {
  type: "text";
  text: string;
}

export interface MessageContent {
  role: string;
  content: string | TextContentPart[];
} 