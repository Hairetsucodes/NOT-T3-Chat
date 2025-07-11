import { APISelectedModel, APIMessage, Message } from "@/types/chat";
import {
  getProviderConfig,
  getProviderName,
  callGoogleStreaming,
} from "./providers";
import { createUniversalProviderStream } from "./utils/streaming";
import { generateTitle } from "./utils/titleGeneration";
import { callOpenAIStreaming } from "./providers/openai";
import {
  ensureCustomSystemMessage,
  ensureSystemMessage,
} from "./utils/systemMessage";

export async function handleLLMRequestStreaming(
  userId: string,
  conversationId: string,
  messages: Message[],
  provider: string,
  modelId: string,
  apiKey: string,
  prompt: string,
  signal?: AbortSignal,
  maxTokens?: number,
  isWebSearch?: boolean,
  isImageGeneration?: boolean,
  lastResponseId?: string
): Promise<ReadableStream> {
  // Use custom prompt or ensure system message
  const messagesWithSystem = prompt
    ? ensureCustomSystemMessage(messages, prompt)
    : ensureSystemMessage(messages);
  // Handle Google separately due to different SDK
  if (provider.toLowerCase() === "google") {
    return await callGoogleStreaming(
      messagesWithSystem,
      modelId,
      apiKey,
      signal,
      isWebSearch
    );
  }

  if (provider.toLowerCase() === "openai") {
    return await callOpenAIStreaming(
      conversationId,
      userId,
      messagesWithSystem,
      modelId,
      apiKey,
      isImageGeneration,
      isWebSearch,
      lastResponseId
    );
  }
  // Use generic provider streaming for all other providers
  const config = getProviderConfig(provider);
  const providerName = getProviderName(provider);

  return await createUniversalProviderStream(
    messagesWithSystem,
    modelId,
    apiKey,
    config,
    providerName,
    undefined,
    signal,
    maxTokens
  );
}

export async function generateConversationTitle(
  messages: APIMessage[],
  selectedModel: APISelectedModel,
  providerKey: string
): Promise<string | null> {
  if (messages.length === 0) return null;

  const lastUserMessage = messages[messages.length - 1];
  if (lastUserMessage?.role !== "user") return null;

  try {
    return await generateTitle(
      lastUserMessage.content,
      selectedModel.provider,
      selectedModel.model,
      providerKey
    );
  } catch (error) {
    console.error("❌ Title generation failed, using fallback:", error);
    // Fallback to simple title generation
    const words = lastUserMessage.content.split(" ").slice(0, 4);
    return (
      words.join(" ") +
      (lastUserMessage.content.split(" ").length > 4 ? "..." : "")
    );
  }
}
