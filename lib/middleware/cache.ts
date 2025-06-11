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
    }

    const cached = await responseCache.get(cacheKey);

    if (cached !== null && cached !== undefined) {
      return {
        stream: simulateReadableStream({
          initialDelayInMs: 20,
          chunkDelayInMs: 3,
          chunks: cached,
        }),
        rawCall: { rawPrompt: null, rawSettings: {} },
      };
    }

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
          .then(async () => {})
          .catch(console.error);
      },
    });

    return {
      stream: stream.pipeThrough(transformStream),
      ...rest,
    };
  },
});
