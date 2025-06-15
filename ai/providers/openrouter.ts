import { ProviderConfig, OpenAIStreamResponse, OpenAINonStreamResponse } from '@/types/llms';
import { transformOpenAIMessages, createOpenAIBody } from '../utils/messageTransforms';

export const openrouterConfig: ProviderConfig = {
  endpoint: "https://openrouter.ai/api/v1/chat/completions",
  headers: (apiKey) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "HTTP-Referer": process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    "X-Title": "OSS T3 Chat",
  }),
  transformMessages: transformOpenAIMessages,
  transformBody: createOpenAIBody,
  parseStreamContent: (parsed: unknown) => {
    const response = parsed as OpenAIStreamResponse;
    const delta = response.choices?.[0]?.delta;
    if (!delta) return null;

    const result: { content?: string; reasoning?: string } = {};

    // Handle different reasoning content formats
    const reasoningContent =
      delta.reasoning ||
      delta.reasoning_content ||
      delta.thought ||
      delta.thinking;
    if (reasoningContent) {
      result.reasoning = reasoningContent;
    }

    if (delta.content) {
      result.content = delta.content;
    }

    return Object.keys(result).length > 0 ? result : null;
  },
  parseNonStreamContent: (data: unknown) => {
    const response = data as OpenAINonStreamResponse;
    return response.choices?.[0]?.message?.content?.trim() || "";
  },
}; 