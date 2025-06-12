import { GoogleGenAI } from "@google/genai";
import { Message } from "@/types/chat";
import { transformGoogleMessages, createGoogleBody } from '../utils/message-transforms';

export async function callGoogleStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  // Remove both "google/" prefix and ":thinking" suffix
  const cleanModelId = modelId.replace("google/", "").replace(":thinking", "");
  const isThinkingModel = modelId.includes(":thinking");

  const ai = new GoogleGenAI({ apiKey });

  return new ReadableStream({
    async start(controller) {
      try {
        const prompt = transformGoogleMessages(messages);
        const requestConfig = createGoogleBody(prompt, cleanModelId, isThinkingModel);

        const response = await ai.models.generateContentStream(requestConfig);

        for await (const chunk of response) {
          const candidate = chunk.candidates?.[0];
          if (!candidate?.content?.parts) continue;

          for (const part of candidate.content.parts) {
            if (part.text) {
              // Check if this is reasoning content for thinking models
              if (isThinkingModel && part.thought) {
                // Stream reasoning content
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({
                      reasoning: part.text,
                    })}\n\n`
                  )
                );
              } else if (!part.thought) {
                // Stream regular content
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({
                      content: part.text,
                    })}\n\n`
                  )
                );
              }
            }
          }
        }

        controller.close();
      } catch (error) {
        if (signal?.aborted) {
          controller.error(new Error("Request was aborted"));
        } else {
          controller.error(error);
        }
      }
    },
  });
}

export async function callGoogleNonStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string
): Promise<string> {
  // Remove both "google/" prefix and ":thinking" suffix
  const cleanModelId = modelId.replace("google/", "").replace(":thinking", "");

  const ai = new GoogleGenAI({ apiKey });

  try {
    const prompt = transformGoogleMessages(messages);
    const requestConfig = createGoogleBody(prompt, cleanModelId, false);

    // Use the generateContent method for non-streaming
    const response = await ai.models.generateContent(requestConfig);

    // Extract the text from the response
    const candidate = response.candidates?.[0];
    if (candidate?.content?.parts) {
      for (const part of candidate.content.parts) {
        if (part.text) {
          return part.text.trim();
        }
      }
    }

    return "";
  } catch (error) {
    console.error("❌ Google API error:", error);
    throw new Error(`Google API error: ${error}`);
  }
} 