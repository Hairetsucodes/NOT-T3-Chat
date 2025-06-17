/**
 * Utility functions for handling streaming reconnection
 */

export interface ReconnectOptions {
  conversationId: string;
  onChunk?: (content: string, reasoning?: string, cached?: boolean) => void;
  onComplete?: (fullContent: string, fullReasoning: string) => void;
  onError?: (error: Error) => void;
}

export interface ReconnectResponse {
  status: string;
  isComplete: boolean;
  content?: string;
  reasoning?: string;
  chunkCount?: number;
  chunks?: Array<{
    index: number;
    content: string;
    reasoning?: string;
  }>;
}

/**
 * Reconnect to a streaming session
 */
export async function reconnectToStream(options: ReconnectOptions): Promise<void> {
  const { conversationId, onChunk, onComplete, onError } = options;
  
  console.log("🔗 reconnectToStream called for conversation:", conversationId);
  
  if (!conversationId) {
    console.error("❌ No conversation ID provided to reconnectToStream");
    onError?.(new Error("Conversation ID is required"));
    return;
  }

  try {
    console.log("📡 Fetching reconnect data from API...");
    const response = await fetch(`/api/chat/reconnect?conversationId=${conversationId}`, {
      method: "GET",
      headers: {
        "Accept": "text/plain",
      },
    });

    console.log("📄 Reconnect API response:", {
      status: response.status,
      ok: response.ok,
      headers: Object.fromEntries(response.headers.entries()),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Reconnect API failed:", response.status, errorText);
      onError?.(new Error(`Reconnect failed: ${response.status} - ${errorText}`));
      return;
    }

    const contentType = response.headers.get("content-type");
    console.log("📋 Response content type:", contentType);
    
    // If response is JSON, the stream is complete
    if (contentType?.includes("application/json")) {
      console.log("📦 Response is JSON (complete stream)");
      const data: ReconnectResponse = await response.json();
      console.log("📊 Complete stream data:", {
        status: data.status,
        isComplete: data.isComplete,
        contentLength: data.content?.length || 0,
        reasoningLength: data.reasoning?.length || 0,
        chunkCount: data.chunkCount,
      });
      
      if (data.isComplete && data.content !== undefined) {
        onComplete?.(data.content, data.reasoning || "");
        return;
      }
    }

    // If response is text/plain, it's a stream
    if (!response.body) {
      onError?.(new Error("No response body"));
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = "";
    let fullReasoning = "";

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6);
            if (data.trim()) {
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.content) {
                  fullContent += parsed.content;
                  onChunk?.(parsed.content, undefined, parsed.cached);
                }
                
                if (parsed.reasoning) {
                  fullReasoning += parsed.reasoning;
                  onChunk?.("", parsed.reasoning, parsed.cached);
                }
                
                if (parsed.isComplete) {
                  onComplete?.(fullContent, fullReasoning);
                  return;
                }
              } catch (parseError) {
                console.warn("Failed to parse reconnect chunk:", parseError);
              }
            }
          }
        }
      }
      
      // Stream ended
      onComplete?.(fullContent, fullReasoning);
      
    } catch (streamError) {
      onError?.(streamError as Error);
    } finally {
      reader.releaseLock();
    }
    
  } catch (error) {
    onError?.(error as Error);
  }
}

/**
 * Check if a streaming session exists
 */
export async function checkStreamingSession(conversationId: string): Promise<ReconnectResponse | null> {
  try {
    const response = await fetch(`/api/chat/reconnect`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ conversationId }),
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch {
    return null;
  }
}

/**
 * Example usage for frontend integration
 */
export function createReconnectHandler() {
  let currentConversationId: string | null = null;
  
  return {
    // Store conversationId from response headers
    setConversationId: (conversationId: string) => {
      currentConversationId = conversationId;
    },
    
    // Handle reconnection
    reconnect: async (
      onChunk: (content: string, reasoning?: string, cached?: boolean) => void,
      onComplete: (fullContent: string, fullReasoning: string) => void,
      onError: (error: Error) => void
    ) => {
      if (!currentConversationId) {
        onError(new Error("No conversation ID available for reconnection"));
        return;
      }
      
      await reconnectToStream({
        conversationId: currentConversationId,
        onChunk,
        onComplete,
        onError,
      });
    },
    
    // Check if reconnection is possible
    canReconnect: () => currentConversationId !== null,
    
    // Clear stored conversationId
    clear: () => {
      currentConversationId = null;
    },
  };
} 