import { Message } from "@/types/chat";
import {
  getProviderConfig,
  getProviderName,
  callGoogleStreaming,
} from "./providers";
import {
  createProviderStream,
  ensureCustomSystemMessage,
  ensureSystemMessage,
} from "./utils/streaming";
import { generateTitle } from "./utils/title-generation";

/**
 * Handle streaming LLM requests for all providers
 */
export async function handleLLMRequestStreaming(
  messages: Message[],
  provider: string,
  modelId: string,
  apiKey: string,
  prompt: string,
  signal?: AbortSignal,
  maxTokens?: number
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
      signal
    );
  }

  // Use generic provider streaming for all other providers
  const config = getProviderConfig(provider);
  const providerName = getProviderName(provider);

  return await createProviderStream(
    messagesWithSystem,
    modelId,
    apiKey,
    config,
    providerName,
    undefined, // Don't pass prompt again since we already processed it in messagesWithSystem
    signal,
    maxTokens
  );
}

// Re-export title generation
export { generateTitle };
