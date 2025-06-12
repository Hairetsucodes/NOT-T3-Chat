import { ProviderConfig, AnthropicStreamResponse, AnthropicNonStreamResponse } from '@/types/llms';
import { transformAnthropicMessages, createAnthropicBody } from '../utils/message-transforms';

export const anthropicConfig: ProviderConfig = {
  endpoint: "https://api.anthropic.com/v1/messages",
  headers: (apiKey) => ({
    "Content-Type": "application/json",
    "x-api-key": apiKey,
    "anthropic-version": "2023-06-01",
  }),
  transformMessages: transformAnthropicMessages,
  transformBody: createAnthropicBody,
  parseStreamContent: (parsed: unknown) => {
    const response = parsed as AnthropicStreamResponse;
    if (response.type === "content_block_delta" && response.delta?.text) {
      return { content: response.delta.text };
    }
    return null;
  },
  parseNonStreamContent: (data: unknown) => {
    const response = data as AnthropicNonStreamResponse;
    return response.content?.[0]?.text?.trim() || "";
  },
}; 