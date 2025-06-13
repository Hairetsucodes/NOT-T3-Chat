import { Message } from "./chat";

// Types for API responses
export interface OpenAIStreamResponse {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning?: string;
      reasoning_content?: string;
      thought?: string;
      thinking?: string;
    };
  }>;
}

export interface OpenAINonStreamResponse {
  choices?: Array<{
    message?: {
      content?: string;
      reasoning_content?: string;
    };
  }>;
}

export interface AnthropicStreamResponse {
  type?: string;
  delta?: {
    text?: string;
  };
}

export interface AnthropicNonStreamResponse {
  content?: Array<{
    text?: string;
  }>;
}

// Provider configuration
export interface ProviderConfig {
  endpoint: string;
  headers: (apiKey: string) => Record<string, string>;
  transformMessages?: (messages: Message[]) => unknown;
  transformBody?: (messages: unknown, modelId: string, maxTokens?: number) => unknown;
  parseStreamContent?: (
    parsed: unknown
  ) => { content?: string; reasoning?: string } | null;
  parseNonStreamContent?: (data: unknown) => string;
}

export interface StreamChunk {
  content?: string;
  reasoning?: string;
}

export interface ParsedResponse {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning?: string;
      reasoning_content?: string;
      thought?: string;
      thinking?: string;
    };
  }>;
  type?: string;
  delta?: {
    text?: string;
  };
  content?: string;
}
