import { Message } from "@/types/chat";

/**
 * Transform messages for OpenAI-compatible providers
 */
export function transformOpenAIMessages(messages: Message[]) {
  return messages.map((msg) => ({
    role: msg.role,
    content: msg.content,
  }));
}

/**
 * Transform messages for Anthropic
 */
export function transformAnthropicMessages(messages: Message[]) {
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  return {
    system: systemMessage?.content || "You are a helpful assistant.",
    messages: conversationMessages.map((msg) => ({
      role: msg.role === "assistant" ? "assistant" : "user",
      content: msg.content,
    })),
  };
}

/**
 * Transform messages for Google Gemini
 */
export function transformGoogleMessages(messages: Message[]): string {
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  let prompt = "";
  if (systemMessage) {
    prompt += systemMessage.content + "\n\n";
  }

  // Add conversation history
  for (const msg of conversationMessages) {
    if (msg.role === "user") {
      prompt += `User: ${msg.content}\n`;
    } else if (msg.role === "assistant") {
      prompt += `Assistant: ${msg.content}\n`;
    }
  }

  return prompt.trim();
}

/**
 * Create request body for OpenAI-compatible providers
 */
export function createOpenAIBody(messages: unknown, modelId: string) {
  const body: {
    model: string;
    messages: unknown;
    temperature?: number;
    stream?: boolean;
    max_tokens?: number;
  } = {
    model: modelId,
    messages,
    temperature: 0.7,
    stream: true,
  };

  return body;
}

/**
 * Create request body for Anthropic
 */
export function createAnthropicBody(
  messages: unknown,
  modelId: string,
  maxTokens?: number
) {
  const { system, messages: msgs } = messages as {
    system: string;
    messages: unknown;
  };
  return {
    model: modelId,
    system,
    max_tokens: maxTokens || 4000,
    messages: msgs,
    stream: true,
  };
}

/**
 * Create request body for Google Gemini
 */
export function createGoogleBody(
  prompt: string,
  modelId: string,
  isThinking = false,
  isWebSearch = false
) {
  const tools = isWebSearch ? [{ googleSearch: {} }] : [];

  const requestConfig: {
    model: string;
    contents: Array<{
      role: string;
      parts: Array<{ text: string }>;
    }>;
    config?: {
      tools?: Array<{ googleSearch: object }>;
      thinkingConfig?: {
        includeThoughts?: boolean;
      };
      responseMimeType?: string;
    };
  } = {
    model: modelId,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: prompt,
          },
        ],
      },
    ],
  };

  // Add config if needed
  if (isThinking || isWebSearch) {
    requestConfig.config = {
      responseMimeType: "text/plain",
    };

    if (isWebSearch) {
      requestConfig.config.tools = tools;
    }

    if (isThinking) {
      requestConfig.config.thinkingConfig = {
        includeThoughts: true,
      };
    }
  }

  return requestConfig;
}
