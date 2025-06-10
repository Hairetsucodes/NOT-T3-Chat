import {
  simulateReadableStream,
  type LanguageModelV1Middleware,
  type LanguageModelV1StreamPart,
} from "ai";
import { responseCache } from "@/lib/prismaCache";
import { isCreativeRequest } from "@/lib/chat";

export const createCacheMiddleware = (
  userId: string
): LanguageModelV1Middleware => ({
  wrapStream: async ({ doStream, params }) => {
    const messages = params.prompt || [];
    const isCreative = isCreativeRequest(messages);

    let cacheKey = JSON.stringify({
      messages: params.prompt,
      temperature: params.temperature,
      maxTokens: params.maxTokens,
    });

    if (isCreative) {
      cacheKey += `_creative_${Date.now()}`;
      console.log("🎨 CREATIVE REQUEST DETECTED - Using unique cache key:", {
        isCreative: true,
        timestamp: new Date().toISOString(),
      });
    }

    console.log("🔑 Cache Key Generated:", {
      keyHash: cacheKey.slice(0, 100) + "...",
      keyLength: cacheKey.length,
      isCreative,
    });

    const cached = await responseCache.get(cacheKey);

    if (cached !== null && cached !== undefined) {
      const cacheSize = await responseCache.size(userId);
      console.log("🎯 CACHE HIT! Returning cached response:", {
        cachedChunks: cached.length,
        cacheSize,
        timestamp: new Date().toISOString(),
      });

      return {
        stream: simulateReadableStream({
          initialDelayInMs: 20,
          chunkDelayInMs: 3,
          chunks: cached,
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    }

    const cacheSizeMiss = await responseCache.size(userId);
    console.log("❄️ CACHE MISS - Generating new response:", {
      cacheSize: cacheSizeMiss,
      timestamp: new Date().toISOString(),
    });

    const { stream, ...rest } = await doStream();

    const fullResponse: LanguageModelV1StreamPart[] = [];

    const transformStream = new TransformStream<
      LanguageModelV1StreamPart,
      LanguageModelV1StreamPart
    >({
      transform(chunk, controller) {
        fullResponse.push(chunk);
        controller.enqueue(chunk);
      },
      flush() {
        responseCache
          .set(cacheKey, fullResponse, 3600, userId)
          .then(async () => {
            const newCacheSize = await responseCache.size(userId);
            console.log("💾 Response cached:", {
              chunks: fullResponse.length,
              cacheSize: newCacheSize,
              timestamp: new Date().toISOString(),
            });
          })
          .catch(console.error);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
});
