/**
 * Utility functions for stream handling
 */

import { APISelectedModel } from "@/types/chat";
import { createMessageApi } from "@/lib/apiServerActions/chat";
import { streamingCache, StreamingSession } from "@/lib/cache/streamingCache";

const isLocal = process.env.IS_LOCAL === "true";

export async function createStreamTransformer(
  stream: ReadableStream,
  userId: string,
  selectedModel: APISelectedModel,
  currentConversationId: string | undefined
): Promise<{ transformedStream: ReadableStream; conversationId: string | undefined }> {
  let fullContent = "";
  let fullReasoning = "";
  let responseId: string | undefined;
  
  // Create cache session if running locally
  let cacheSession: StreamingSession | null = null;
  
  if (isLocal && currentConversationId) {
    cacheSession = await streamingCache.createSession(userId, currentConversationId);
  }
  
  const transformedStream = new ReadableStream({
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
                  currentConversationId,
                  undefined,
                  responseId
                );
              }
              // Mark cache session as complete
              if (cacheSession && currentConversationId) {
                console.log("✅ Marking cache session as complete for:", currentConversationId);
                await streamingCache.completeSession(currentConversationId);
                
                // Debug: Check final cache state
                const finalSession = await streamingCache.getSession(currentConversationId);
                console.log("📈 Final cache session state:", {
                  conversationId: currentConversationId,
                  status: finalSession?.status,
                  chunkCount: finalSession?.chunks.length,
                });
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
                      
                      // Process content and reasoning together to avoid splitting into separate chunks
                      let hasContent = false;
                      let hasReasoning = false;
                      let chunkContent = "";
                      let chunkReasoning = "";
                      
                      if (parsed.content || parsed.image_url) {
                        chunkContent = parsed.content || parsed.image_url;
                        fullContent += chunkContent;
                        hasContent = true;
                      }
                      
                      if (parsed.reasoning) {
                        chunkReasoning = parsed.reasoning;
                        fullReasoning += chunkReasoning;
                        hasReasoning = true;
                      }
                      
                      // Cache the chunk if running locally - combine content and reasoning in one chunk
                      if (cacheSession && currentConversationId && (hasContent || hasReasoning)) {
                        
                        await streamingCache.addChunk(currentConversationId, chunkContent, chunkReasoning || undefined);
                      }
                      if (parsed.previous_response_id) {
                        responseId = parsed.previous_response_id;
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
          // Mark cache session as error
          if (cacheSession && currentConversationId) {
            await streamingCache.errorSession(currentConversationId);
          }
          controller.error(error);
        }
      }

      pump();
    },
  });
  
  return { transformedStream, conversationId: currentConversationId };
}
