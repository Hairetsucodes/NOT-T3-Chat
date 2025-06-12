import { StreamingJSONParser } from "./json-parser";
import { createErrorStream } from "./errors";
import { ProviderConfig } from "@/types/llms";
import { Message } from "@/types/chat";

/**
 * Generic streaming handler for all LLM providers
 */
export async function createProviderStream(
  messages: Message[],
  modelId: string,
  apiKey: string,
  config: ProviderConfig,
  providerName: string,
  prompt?: string,
  signal?: AbortSignal,
  maxTokens?: number
): Promise<ReadableStream> {
  // Use custom prompt or ensure system message
  const messagesWithSystem = prompt
    ? ensureCustomSystemMessage(messages, prompt)
    : ensureSystemMessage(messages);

  const transformedMessages = config.transformMessages
    ? config.transformMessages(messagesWithSystem)
    : messagesWithSystem;
  const body = config.transformBody
    ? config.transformBody(transformedMessages, modelId, maxTokens)
    : transformedMessages;

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: config.headers(apiKey),
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    return createErrorStream(providerName, response.status, errorText);
  }

  return new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      const parser = new StreamingJSONParser();

      if (!reader) {
        controller.error(new Error("No response body reader"));
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const results = parser.processChunk(chunk);

          for (const result of results) {
            if (result.reasoning) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    reasoning: result.reasoning,
                  })}\n\n`
                )
              );
            }

            if (result.content) {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    content: result.content,
                  })}\n\n`
                )
              );
            }
          }
        }

        // Process any remaining data in buffer
        const finalResults = parser.flush();
        for (const result of finalResults) {
          if (result.reasoning) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({
                  reasoning: result.reasoning,
                })}\n\n`
              )
            );
          }

          if (result.content) {
            controller.enqueue(
              new TextEncoder().encode(
                `data: ${JSON.stringify({
                  content: result.content,
                })}\n\n`
              )
            );
          }
        }

        controller.close();
      } catch (error) {
        console.error(`💥 ${providerName} stream error:`, error);
        controller.error(error);
      }
    },
  });
}

/**
 * Generic non-streaming handler for all LLM providers
 */
export async function callProviderNonStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  config: ProviderConfig,
  providerName: string,
  maxTokens: number = 50
): Promise<string> {
  const transformedMessages = config.transformMessages
    ? config.transformMessages(messages)
    : messages;
  let body = config.transformBody
    ? config.transformBody(transformedMessages, modelId, maxTokens)
    : transformedMessages;

  // Override max_tokens and temperature for title generation
  if (typeof body === "object" && body !== null) {
    body = { ...body, max_tokens: maxTokens, temperature: 0.3, stream: false };
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: config.headers(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `${providerName} API error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  return config.parseNonStreamContent ? config.parseNonStreamContent(data) : "";
}

/**
 * Add system message if not present
 */
export function ensureSystemMessage(messages: Message[]): Message[] {
  return messages.some((m) => m.role === "system")
    ? messages
    : [
        {
          role: "system",
          content: "You are a helpful assistant.",
          timestamp: new Date(),
        } as Message,
        ...messages,
      ];
}

/**
 * Add or replace system message with custom prompt
 */
export function ensureCustomSystemMessage(
  messages: Message[],
  prompt: string
): Message[] {
  const systemMessage: Message = {
    role: "system",
    content: prompt,
    timestamp: new Date(),
  };

  // Remove existing system messages and add the custom one at the beginning
  const nonSystemMessages = messages.filter((m) => m.role !== "system");
  return [systemMessage, ...nonSystemMessages];
}
