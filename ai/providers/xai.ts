import { ProviderConfig, OpenAIStreamResponse, OpenAINonStreamResponse } from '@/types/llms';
import { transformOpenAIMessages, createOpenAIBody } from '../utils/messageTransforms';

export const xaiConfig: ProviderConfig = {
  endpoint: "https://api.x.ai/v1/chat/completions",
  headers: (apiKey) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  }),
  transformMessages: transformOpenAIMessages,
  transformBody: createOpenAIBody,
  parseStreamContent: (parsed: unknown) => {
    const response = parsed as OpenAIStreamResponse;
    const content = response.choices?.[0]?.delta?.content;
    return content ? { content } : null;
  },
  parseNonStreamContent: (data: unknown) => {
    const response = data as OpenAINonStreamResponse;
    const message = response.choices?.[0]?.message;
    if (!message) return "";
    
    // For reasoning models, content might be in reasoning_content field
    const content = message.content || message.reasoning_content || "";
    return content.trim();
  },
}; 