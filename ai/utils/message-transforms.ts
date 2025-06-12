import { Message } from '@/types/chat';

/**
 * Transform messages for OpenAI-compatible providers
 */
export function transformOpenAIMessages(messages: Message[]) {
  return messages.map((msg) => ({ 
    role: msg.role, 
    content: msg.content 
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
  return {
    model: modelId,
    messages,
    temperature: 0.7,
    max_tokens: 4000,
    stream: true,
  };
}

/**
 * Create request body for Anthropic
 */
export function createAnthropicBody(messages: unknown, modelId: string) {
  const { system, messages: msgs } = messages as {
    system: string;
    messages: unknown;
  };
  
  return {
    model: modelId,
    max_tokens: 4000,
    system,
    messages: msgs,
    stream: true,
  };
}

/**
 * Create request body for Google Gemini
 */
export function createGoogleBody(prompt: string, modelId: string, isThinking = false) {
  const requestConfig: {
    model: string;
    contents: string;
    config?: {
      thinkingConfig?: {
        includeThoughts?: boolean;
      };
    };
  } = {
    model: modelId,
    contents: prompt,
  };

  // Add thinking config for thinking models
  if (isThinking) {
    requestConfig.config = {
      thinkingConfig: {
        includeThoughts: true,
      },
    };
  }

  return requestConfig;
} 