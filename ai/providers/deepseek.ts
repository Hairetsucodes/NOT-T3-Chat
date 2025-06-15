import { ProviderConfig, OpenAIStreamResponse, OpenAINonStreamResponse } from '@/types/llms';
import { transformOpenAIMessages, createOpenAIBody } from '../utils/messageTransforms';

export const deepseekConfig: ProviderConfig = {
  endpoint: "https://api.deepseek.com/v1/chat/completions",
  headers: (apiKey) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }),
  transformMessages: transformOpenAIMessages,
  transformBody: createOpenAIBody,
  parseStreamContent: (parsed: unknown) => {
    const response = parsed as OpenAIStreamResponse;
    const delta = response.choices?.[0]?.delta;
    if (!delta) return null;

    const result: { content?: string; reasoning?: string } = {};

    if (delta.reasoning_content) {
      result.reasoning = delta.reasoning_content;
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