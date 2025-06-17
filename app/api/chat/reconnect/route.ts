import { auth } from "@/auth";
import { streamingCache } from "@/lib/cache/streamingCache";
import { NextRequest } from "next/server";

const isLocal = process.env.IS_LOCAL === "true";

// Support HEAD method to check if session exists without streaming
export async function HEAD(req: NextRequest) {
  return handleReconnectRequest(req, true);
}

export async function GET(req: NextRequest) {
  return handleReconnectRequest(req, false);
}

async function handleReconnectRequest(req: NextRequest, headOnly: boolean = false) {
  // Only available in local development
  if (!isLocal) {
    return new Response("Not available in production", { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");

  if (!conversationId) {
    return new Response("conversationId parameter is required", { status: 400 });
  }

  try {
    console.log("🔍 Reconnect API called for conversation:", conversationId, "by user:", userId);
    
    // Debug: Check what's in the cache
    const cacheStats = await streamingCache.getStats();
    console.log("📊 Current cache stats:", cacheStats);
    
    const reconnectData = await streamingCache.getReconnectData(conversationId);
    
    if (!reconnectData) {
      console.log("❌ Streaming session not found for conversation:", conversationId);
      console.log("💾 Available sessions in cache:", cacheStats.sessions.map(s => s.conversationId));
      return new Response("Streaming session not found or expired", { status: 404 });
    }

    console.log("📊 Reconnect data found:", {
      status: reconnectData.status,
      isComplete: reconnectData.isComplete,
      chunkCount: reconnectData.chunks.length,
    });

    // Verify the session belongs to the user
    const sessionData = await streamingCache.getSession(conversationId);
    if (sessionData && sessionData.userId !== userId) {
      console.log("🚫 Unauthorized access attempt by user:", userId, "for session owned by:", sessionData.userId);
      return new Response("Unauthorized access to streaming session", { status: 403 });
    }

    // For HEAD requests, just return status without body
    if (headOnly) {
      return new Response(null, { 
        status: 200,
        headers: {
          "X-Stream-Status": reconnectData.status,
          "X-Stream-Complete": reconnectData.isComplete.toString(),
          "X-Chunk-Count": reconnectData.chunks.length.toString(),
        }
      });
    }

    // If streaming is complete, return all chunks at once
    if (reconnectData.isComplete) {
      console.log("✅ Stream is complete, returning all chunks as JSON");
      let fullContent = "";
      let fullReasoning = "";

      reconnectData.chunks.forEach(chunk => {
        if (chunk.content) {
          fullContent += chunk.content;
        }
        if (chunk.reasoning) {
          fullReasoning += chunk.reasoning;
        }
      });

      console.log("📦 Final response stats:", {
        contentLength: fullContent.length,
        reasoningLength: fullReasoning.length,
        chunkCount: reconnectData.chunks.length,
      });

      const response = {
        status: reconnectData.status,
        isComplete: true,
        content: fullContent,
        reasoning: fullReasoning,
        chunkCount: reconnectData.chunks.length,
      };

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // If still streaming, return a stream of the cached chunks
    console.log("🌊 Stream is still active, creating SSE stream with cached chunks");
    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;
    
    const stream = new ReadableStream({
      start(controller) {        
        try {
          console.log("🚀 Starting SSE stream, sending", reconnectData.chunks.length, "cached chunks");
          
          // Send all cached chunks first
          reconnectData.chunks.forEach((chunk) => {
           
            
            if (chunk.content) {
              const data = JSON.stringify({
                content: chunk.content,
                index: chunk.index,
                cached: true,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
            if (chunk.reasoning) {
              const data = JSON.stringify({
                reasoning: chunk.reasoning,
                index: chunk.index,
                cached: true,
              });
              controller.enqueue(encoder.encode(`data: ${data}\n\n`));
            }
          });

          // Send status update after cached chunks
          const statusData = JSON.stringify({
            status: reconnectData.status,
            isComplete: reconnectData.isComplete,
            resumePoint: reconnectData.chunks.length,
            cached: true,
          });
          controller.enqueue(encoder.encode(`data: ${statusData}\n\n`));

          // If stream is still active, subscribe to new chunks
          if (!reconnectData.isComplete) {
            console.log("🔔 Subscribing to new chunks for ongoing stream:", conversationId);
            
            unsubscribe = streamingCache.subscribe(
              conversationId,
              // onChunk callback
              (chunk) => {
        
                
                if (chunk.content) {
                  const data = JSON.stringify({
                    content: chunk.content,
                    index: chunk.index,
                    cached: false,
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
                if (chunk.reasoning) {
                  const data = JSON.stringify({
                    reasoning: chunk.reasoning,
                    index: chunk.index,
                    cached: false,
                  });
                  controller.enqueue(encoder.encode(`data: ${data}\n\n`));
                }
              },
              // onComplete callback
              () => {
                console.log("✅ Stream completed, sending final status and closing");
                const completionData = JSON.stringify({
                  status: 'completed',
                  isComplete: true,
                  cached: false,
                });
                controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
                controller.close();
                console.log("🏁 SSE stream closed after completion");
              }
            );
          } else {
            // Stream already complete, close immediately
            controller.close();
            console.log("🏁 SSE stream closed (already completed)");
          }
          
        } catch (error) {
          console.error("❌ Error in SSE stream:", error);
          if (unsubscribe) {
            unsubscribe();
          }
          controller.error(error);
        }
      },
      
      cancel() {
        console.log("🚫 SSE stream cancelled by client");
        // Cleanup subscription when client disconnects
        if (unsubscribe) {
          unsubscribe();
        }
      }
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "private, max-age=0, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
    
  } catch (error) {
    console.error("Reconnect API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// Also support POST for more complex reconnect scenarios
export async function POST(req: NextRequest) {
  if (!isLocal) {
    return new Response("Not available in production", { status: 404 });
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { conversationId, lastChunkIndex } = await req.json();
    
    if (!conversationId) {
      return new Response("conversationId is required", { status: 400 });
    }

    const reconnectData = await streamingCache.getReconnectData(conversationId);
    
    if (!reconnectData) {
      return new Response("Streaming session not found", { status: 404 });
    }

    // Return chunks after the specified index
    const resumeChunks = reconnectData.chunks.filter(
      chunk => chunk.index > (lastChunkIndex || -1)
    );

    return new Response(JSON.stringify({
      status: reconnectData.status,
      isComplete: reconnectData.isComplete,
      chunks: resumeChunks,
      totalChunks: reconnectData.chunks.length,
    }), {
      headers: { "Content-Type": "application/json" },
    });
    
  } catch (error) {
    console.error("Reconnect POST API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
} 