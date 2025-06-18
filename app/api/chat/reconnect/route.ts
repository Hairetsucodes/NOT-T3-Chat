import { auth } from "@/auth";
import { streamingCache } from "@/lib/cache/streamingCache";
import { NextRequest } from "next/server";

// Support HEAD method to check if session exists without streaming
export async function HEAD(req: NextRequest) {
  return handleReconnectRequest(req, true);
}

export async function GET(req: NextRequest) {
  return handleReconnectRequest(req, false);
}

async function handleReconnectRequest(
  req: NextRequest,
  headOnly: boolean = false
) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;
  const url = new URL(req.url);
  const conversationId = url.searchParams.get("conversationId");

  if (!conversationId) {
    return new Response("conversationId parameter is required", {
      status: 400,
    });
  }

  try {
    console.log("🔍 Optimized reconnect API called for:", conversationId, "by user:", userId);

    const reconnectData = await streamingCache.getReconnectData(conversationId);

    if (!reconnectData) {
      console.log("❌ Streaming session not found for conversation:", conversationId);
      return new Response("Streaming session not found or expired", {
        status: 404,
      });
    }

    console.log("📊 Reconnect data found:", {
      status: reconnectData.status,
      isComplete: reconnectData.isComplete,
      chunkCount: reconnectData.chunks.length,
      batchCount: (reconnectData as any).batches?.length || 0,
    });

    // Verify the session belongs to the user
    const sessionData = await streamingCache.getSession(conversationId);
    if (sessionData && sessionData.userId !== userId) {
      console.log("🚫 Unauthorized access attempt");
      return new Response("Unauthorized access to streaming session", {
        status: 403,
      });
    }

    // For HEAD requests, just return status without body
    if (headOnly) {
      return new Response(null, {
        status: 200,
        headers: {
          "X-Stream-Status": reconnectData.status,
          "X-Stream-Complete": reconnectData.isComplete.toString(),
          "X-Chunk-Count": reconnectData.chunks.length.toString(),
          "X-Batch-Count": ((reconnectData as any).batches?.length || 0).toString(),
        },
      });
    }

    // If streaming is complete, return optimized response
    if (reconnectData.isComplete) {
      console.log("✅ Stream complete, using optimized delivery");
      
      // Use batches for faster transfer if available
      const batchData = reconnectData as any;
      if (batchData.batches && batchData.batches.length > 0) {
        let fullContent = "";
        let fullReasoning = "";

        // Process batches efficiently
        for (const batch of batchData.batches) {
          const batchChunks = batch.chunks.length > 0 ? batch.chunks : 
            await streamingCache.getChunkRange(conversationId, batch.startIndex, batch.endIndex);
          
          batchChunks.forEach((chunk: any) => {
            if (chunk.content) fullContent += chunk.content;
            if (chunk.reasoning) fullReasoning += chunk.reasoning;
          });
        }

        console.log("📦 Optimized batch response:", {
          contentLength: fullContent.length,
          reasoningLength: fullReasoning.length,
          batchCount: batchData.batches.length,
        });

        return new Response(JSON.stringify({
          status: reconnectData.status,
          isComplete: true,
          content: fullContent,
          reasoning: fullReasoning,
          chunkCount: reconnectData.chunks.length,
          batchCount: batchData.batches.length,
          optimized: true,
        }), {
          headers: { "Content-Type": "application/json" },
        });
      }

      // Fallback to original method
      let fullContent = "";
      let fullReasoning = "";

      reconnectData.chunks.forEach((chunk) => {
        if (chunk.content) fullContent += chunk.content;
        if (chunk.reasoning) fullReasoning += chunk.reasoning;
      });

      return new Response(JSON.stringify({
        status: reconnectData.status,
        isComplete: true,
        content: fullContent,
        reasoning: fullReasoning,
        chunkCount: reconnectData.chunks.length,
      }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // If still streaming, create optimized batch stream
    console.log("🌊 Creating optimized batch stream");
    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;

    const stream = new ReadableStream({
      start(controller) {
        try {
          console.log("🚀 Starting optimized SSE stream");

          // Send cached batches first (much faster than individual chunks)
          if (reconnectData.batches && reconnectData.batches.length > 0) {
            console.log(`📦 Sending ${reconnectData.batches.length} cached batches`);
            
            for (const batch of reconnectData.batches) {
              const batchData = JSON.stringify({
                type: "batch",
                startIndex: batch.startIndex,
                endIndex: batch.endIndex,
                size: batch.size,
                compressed: batch.compressed,
                cached: true,
              });
              controller.enqueue(encoder.encode(`data: ${batchData}\n\n`));

              // Send batch content efficiently
              if (batch.chunks.length > 0) {
                batch.chunks.forEach((chunk) => {
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
              }
            }
          } else {
            // Fallback: Send individual cached chunks
            console.log(`📦 Sending ${reconnectData.chunks.length} cached chunks`);
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
          }

          // Send status update after cached data
          const statusData = JSON.stringify({
            status: reconnectData.status,
            isComplete: reconnectData.isComplete,
            resumePoint: reconnectData.chunks.length,
            cached: true,
            optimized: true,
          });
          controller.enqueue(encoder.encode(`data: ${statusData}\n\n`));

          // Subscribe to new batches for ongoing streams
          if (!reconnectData.isComplete) {
            console.log("🔔 Subscribing to new batches for ongoing stream");

            // Subscribe to batches for better performance
            unsubscribe = streamingCache.subscribeToBatches(
              conversationId,
              // onBatch callback
              (batch) => {
                console.log(`📦 New batch received: ${batch.startIndex}-${batch.endIndex}`);
                
                const batchData = JSON.stringify({
                  type: "batch",
                  startIndex: batch.startIndex,
                  endIndex: batch.endIndex,
                  size: batch.size,
                  cached: false,
                });
                controller.enqueue(encoder.encode(`data: ${batchData}\n\n`));

                // Send batch chunks
                batch.chunks.forEach((chunk) => {
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
                });
              },
              // onComplete callback
              () => {
                console.log("✅ Optimized stream completed");
                const completionData = JSON.stringify({
                  status: "completed",
                  isComplete: true,
                  cached: false,
                  optimized: true,
                });
                controller.enqueue(encoder.encode(`data: ${completionData}\n\n`));
                controller.close();
              }
            );
          } else {
            controller.close();
            console.log("🏁 Optimized stream closed (already completed)");
          }
        } catch (error) {
          console.error("❌ Error in optimized SSE stream:", error);
          if (unsubscribe) unsubscribe();
          controller.error(error);
        }
      },

      cancel() {
        console.log("🚫 Optimized SSE stream cancelled by client");
        if (unsubscribe) unsubscribe();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "private, max-age=0, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
        "X-Optimized": "true",
      },
    });
  } catch (error) {
    console.error("Optimized reconnect API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}

// Optimized POST endpoint for batch operations
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const { conversationId, startIndex, endIndex } = await req.json();

    if (!conversationId) {
      return new Response("conversationId is required", { status: 400 });
    }

    // Get specific chunk range efficiently
    const chunks = await streamingCache.getChunkRange(
      conversationId,
      startIndex || 0,
      endIndex || Number.MAX_SAFE_INTEGER
    );

    // Get session status
    const sessionData = await streamingCache.getSession(conversationId);
    const reconnectData = await streamingCache.getReconnectData(conversationId);

    return new Response(JSON.stringify({
      status: sessionData?.status || "unknown",
      isComplete: reconnectData?.isComplete || false,
      chunks,
      batchCount: reconnectData?.batches?.length || 0,
      totalChunks: chunks.length,
      optimized: true,
    }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Optimized reconnect POST API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
