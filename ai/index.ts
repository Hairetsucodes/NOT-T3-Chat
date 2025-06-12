import { Message } from "@/types/chat";
import {
  getProviderConfig,
  getProviderName,
  callGoogleStreaming,
} from "./providers";
import { createProviderStream, ensureSystemMessage } from "./utils/streaming";
import { generateTitle } from "./utils/title-generation";

/**
 * Handle streaming LLM requests for all providers
 */
export async function handleLLMRequestStreaming(
  messages: Message[],
  provider: string,
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  // Add system message if not present
  const messagesWithSystem = ensureSystemMessage(messages);

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
    signal
  );
}

// Re-export title generation
export { generateTitle };
