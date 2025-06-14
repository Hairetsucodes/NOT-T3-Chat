/**
 * Utility functions for stream handling
 */

import { APISelectedModel } from "@/types/chat";
import { createMessageApi } from "@/lib/apiServerActions/chat";

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