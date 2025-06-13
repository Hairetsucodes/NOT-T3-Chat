import { createErrorStream } from "./errors";
import { ProviderConfig } from "@/types/llms";
import { Message } from "@/types/chat";

interface ParsedStreamResponse {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning?: string;
      reasoning_content?: string;
      thought?: string;
      thinking?: string;
    };
  }>;
  type?: string;
  delta?: {
    text?: string;
  };
  content?: string;
}

/**
 * Tokenize content into smaller chunks for better streaming experience
 */
function tokenizeContent(content: string): string[] {
  if (!content) return [];

  // Split by word boundaries and punctuation while preserving spaces and punctuation
  const tokens: string[] = [];
  const regex = /(\s+|[.,!?;:]|\S+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    tokens.push(match[0]);
  }

  return tokens.filter((token) => token.length > 0);
}

/**
 * Extract content from parsed response
 */
function extractContentFromParsed(
  parsed: unknown
): { content?: string; reasoning?: string } | null {
  if (!parsed || typeof parsed !== "object") return null;

  const result: { content?: string; reasoning?: string } = {};
  const parsedObj = parsed as ParsedStreamResponse;

  // Handle OpenAI/XAI format
  if (parsedObj.choices?.[0]?.delta) {
    const delta = parsedObj.choices[0].delta;

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
  }

  // Handle Anthropic format
  else if (parsedObj.type === "content_block_delta" && parsedObj.delta?.text) {
    result.content = parsedObj.delta.text;
  }

  // Handle direct content
  else if (parsedObj.content) {
    result.content = parsedObj.content;
  }

  return Object.keys(result).length > 0 ? result : null;
}

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
      let buffer = "";

      // Helper function to sleep for consistent timing
      const sleep = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      if (!reader) {
        controller.error(new Error("No response body reader"));
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Process individual SSE messages as they come in
          const lines = buffer.split("\n");
          buffer = lines.pop() || ""; // Keep incomplete line in buffer

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

            const data = trimmedLine.slice(6).trim();
            if (data === "[DONE]") continue;
            if (!data) continue;

            try {
              const parsed = JSON.parse(data);
              const result = extractContentFromParsed(parsed);

              if (result) {
                // Stream reasoning tokens with consistent timing
                if (result.reasoning) {
                  const tokens = tokenizeContent(result.reasoning);
                  for (const token of tokens) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          reasoning: token,
                        })}\n\n`
                      )
                    );
                    await sleep(8); // 25ms delay between tokens
                  }
                }

                // Stream content tokens with consistent timing
                if (result.content) {
                  const tokens = tokenizeContent(result.content);
                  for (const token of tokens) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          content: token,
                        })}\n\n`
                      )
                    );
                    await sleep(8); // 25ms delay between tokens
                  }
                }
              }
            } catch {
              // Skip invalid JSON silently
              continue;
            }
          }
        }

        // Process any remaining data in buffer
        if (buffer.trim()) {
          const trimmedBuffer = buffer.trim();
          if (trimmedBuffer.startsWith("data: ")) {
            const data = trimmedBuffer.slice(6).trim();
            if (data && data !== "[DONE]") {
              try {
                const parsed = JSON.parse(data);
                const result = extractContentFromParsed(parsed);

                if (result) {
                  if (result.reasoning) {
                    const tokens = tokenizeContent(result.reasoning);
                    for (const token of tokens) {
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({
                            reasoning: token,
                          })}\n\n`
                        )
                      );
                      await sleep(25);
                    }
                  }

                  if (result.content) {
                    const tokens = tokenizeContent(result.content);
                    for (const token of tokens) {
                      controller.enqueue(
                        new TextEncoder().encode(
                          `data: ${JSON.stringify({
                            content: token,
                          })}\n\n`
                        )
                      );
                      await sleep(25);
                    }
                  }
                }
              } catch {
                // Skip invalid JSON
              }
            }
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
