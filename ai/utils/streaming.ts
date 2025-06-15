import { createErrorStream } from "./errors";
import { ProviderConfig } from "@/types/llms";
import { Message } from "@/types/chat";
import { ParsedStreamResponse } from "@/types/stream";

function tokenizeContent(content: string): string[] {
  if (!content) return [];

  const tokens: string[] = [];
  const regex = /(\s+|[.,!?;:]|\S+)/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    tokens.push(match[0]);
  }

  return tokens.filter((token) => token.length > 0);
}

function extractContentFromParsed(
  parsed: unknown
): { content?: string; reasoning?: string } | null {
  if (!parsed || typeof parsed !== "object") return null;

  const result: { content?: string; reasoning?: string } = {};
  const parsedObj = parsed as ParsedStreamResponse;

  if (parsedObj.choices?.[0]?.delta) {
    const delta = parsedObj.choices[0].delta;

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
  } else if (
    parsedObj.type === "content_block_delta" &&
    parsedObj.delta?.text
  ) {
    result.content = parsedObj.delta.text;
  } else if (parsedObj.content) {
    result.content = parsedObj.content;
  }

  return Object.keys(result).length > 0 ? result : null;
}

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

          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

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

export function ensureCustomSystemMessage(
  messages: Message[],
  prompt: string
): Message[] {
  const systemMessage: Message = {
    role: "system",
    content: prompt,
    timestamp: new Date(),
  };

  const nonSystemMessages = messages.filter((m) => m.role !== "system");
  return [systemMessage, ...nonSystemMessages];
}
