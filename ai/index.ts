import { APISelectedModel, APIMessage, Message } from "@/types/chat";
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
import { SUPPORTED_PROVIDERS } from "@/constants/supportedProviders";
import { SupportedProvider } from "@/types/chat";
import { createMessageApi } from "@/lib/apiServerActions/chat";

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

// Helper functions
export function createErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export function capitalizeProvider(provider: string): string {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}

export function validateProviderKey(
  providerKey: string | null,
  provider: string
) {
  if (
    !providerKey &&
    !SUPPORTED_PROVIDERS.includes(provider as SupportedProvider)
  ) {
    return createErrorResponse(
      "OpenRouter API key not found. This model requires an OpenRouter API key. Please add your OpenRouter API key in settings."
    );
  }

  if (!providerKey) {
    const providerName = capitalizeProvider(provider);
    return createErrorResponse(
      `${providerName} API key not found. Please add your ${providerName} API key in settings.`
    );
  }

  return null;
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

export function createStreamTransformer(
  stream: ReadableStream,
  userId: string,
  selectedModel: APISelectedModel,
  currentConversationId: string | undefined
) {
  let fullContent = "";
  let fullReasoning = "";

  return new ReadableStream({
    start(controller) {
      const reader = stream.getReader();
      const decoder = new TextDecoder();

      async function pump() {
        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) {
              // Save assistant response when streaming is complete
              if (currentConversationId && fullContent) {
                await createMessageApi(
                  userId,
                  fullContent,
                  "assistant",
                  selectedModel.provider,
                  selectedModel.model,
                  fullReasoning,
                  currentConversationId
                );
              }
              controller.close();
              break;
            }

            const chunk = decoder.decode(value, { stream: true });

            // Extract content and reasoning from SSE format to accumulate
            if (chunk.includes("data: ")) {
              try {
                const lines = chunk.split("\n");
                for (const line of lines) {
                  if (line.startsWith("data: ")) {
                    const data = line.slice(6);
                    if (data.trim()) {
                      const parsed = JSON.parse(data);
                      if (parsed.content) {
                        fullContent += parsed.content;
                      }
                      if (parsed.reasoning) {
                        fullReasoning += parsed.reasoning;
                      }
                    }
                  }
                }
              } catch {
                // Skip invalid JSON
              }
            }

            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
        }
      }

      pump();
    },
  });
}
