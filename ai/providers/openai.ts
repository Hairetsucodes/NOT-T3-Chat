import { ProviderConfig, OpenAIStreamResponse, OpenAINonStreamResponse } from '@/types/llms';
import { transformOpenAIMessages, createOpenAIBody } from '../utils/message-transforms';

export const openaiConfig: ProviderConfig = {
  endpoint: "https://api.openai.com/v1/chat/completions",
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
    return response.choices?.[0]?.message?.content?.trim() || "";
  },
}; 