import { GoogleGenAI } from "@google/genai";
import { Message } from "@/types/chat";
import {
  transformGoogleMessages,
  createGoogleBody,
} from "../utils/messageTransforms";
import {
  createErrorStream,
  createStandardError,
  handleAbortError,
} from "../utils/errors";

/**
 * Parse Google API error message to extract detailed error information
 */
function parseGoogleError(error: unknown): {
  code: number;
  message: string;
  isQuotaError: boolean;
} {
  // Default values
  let code = 500;
  let message = "Unknown Google API error";
  let isQuotaError = false;

  // Check if it's a Google Client SDK error
  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;

    // Extract code from error.code or error.status
    if (typeof errorObj.code === "number") {
      code = errorObj.code;
    } else if (errorObj.status === "Too Many Requests") {
      code = 429;
    }

    // Extract message
    if (typeof errorObj.message === "string") {
      message = errorObj.message;

      // Try to parse JSON from the message if it contains JSON
      try {
        // Look for JSON in the message (using regex compatible with older ES versions)
        const jsonMatch = message.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonData = JSON.parse(jsonMatch[0]);
          if (jsonData.error?.message) {
            message = jsonData.error.message;
          }
        }
      } catch {
        // If JSON parsing fails, use the original message
      }
    }

    // Check if it's a quota error
    isQuotaError =
      code === 429 ||
      message.includes("quota") ||
      message.includes("free quota tier") ||
      message.includes("RESOURCE_EXHAUSTED") ||
      message.includes("free_tier");
  }

  return { code, message, isQuotaError };
}

/**
 * Get suggestion for free Google model based on the requested model
 */
function suggestFreeModel(requestedModel: string): string {
  // If user requested a 2.5 model, suggest the fastest free model
  if (requestedModel.includes("2.5")) {
    return "gemini-2.0-flash-lite";
  }

  // If user requested a 2.0 model, suggest flash lite
  if (requestedModel.includes("2.0")) {
    return "gemini-2.0-flash-lite";
  }

  // For 1.5 models, suggest flash
  if (requestedModel.includes("1.5")) {
    return "gemini-1.5-flash";
  }

  // Default suggestion
  return "gemini-1.5-flash";
}

export async function callGoogleStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal,
  isWebSearch?: boolean
): Promise<ReadableStream> {
  // Remove both "google/" prefix and ":thinking" suffix
  const cleanModelId = modelId.replace("google/", "").replace(":thinking", "");
  const isThinkingModel = modelId.includes(":thinking");

  const ai = new GoogleGenAI({ apiKey });

  return new ReadableStream({
    async start(controller) {
      try {
        // Check for abort signal before starting
        const abortError = handleAbortError(signal);
        if (abortError) {
          controller.error(abortError);
          return;
        }

        const prompt = transformGoogleMessages(messages);
        const requestConfig = createGoogleBody(
          prompt,
          cleanModelId,
          isThinkingModel,
          isWebSearch
        );
        const response = await ai.models.generateContentStream(requestConfig);

        for await (const chunk of response) {
          // Check for abort signal during streaming
          if (signal?.aborted) {
            controller.error(new Error("Request was aborted"));
            return;
          }

          const candidate = chunk.candidates?.[0];
          if (!candidate?.content?.parts) continue;

          for (const part of candidate.content.parts) {
            if (part.text) {
              // Check if this is reasoning content for thinking models
              if (isThinkingModel && part.thought) {
                // Stream reasoning content directly
                controller.enqueue(
                  new TextEncoder().encode(
                    `data: ${JSON.stringify({
                      reasoning: part.text,
                    })}\n\n`
                  )
                );
              } else if (!part.thought) {
                // Stream content directly as raw tokens from Google
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
        // Handle abort signals first
        if (signal?.aborted) {
          controller.error(new Error("Request was aborted"));
          return;
        }

        // Parse the Google error
        const { code, message, isQuotaError } = parseGoogleError(error);

        // Handle quota exceeded errors specially
        if (isQuotaError) {
          let quotaMessage = "**Google API Quota Exceeded**\n\n";

          // Check if it's a free tier issue
          if (
            message.includes("doesn't have a free quota tier") ||
            message.includes("free_tier") ||
            message.includes("RESOURCE_EXHAUSTED")
          ) {
            const suggestedModel = suggestFreeModel(cleanModelId);
            quotaMessage += `The model \`${cleanModelId}\` requires a paid Google API plan.\n\n`;
            quotaMessage += `**💡 Try these free alternatives:**\n`;
            quotaMessage += `• \`${suggestedModel}\` (recommended)\n`;
            quotaMessage += `• \`gemini-1.5-flash\` (fast and capable)\n`;
            quotaMessage += `• \`gemini-1.0-pro\` (reliable general purpose)\n\n`;
            quotaMessage += `You can switch models in the chat settings.`;
          } else {
            quotaMessage += "You've exceeded your request quota.\n\n";
            quotaMessage += "**Solutions:**\n";
            quotaMessage += "• Wait a few minutes before trying again\n";
            quotaMessage += "• Upgrade your Google API quota\n";
            quotaMessage += "• Switch to a different model temporarily";
          }

          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({
                content: quotaMessage,
              })}\n\n`
            )
          );
          controller.close();
          return;
        }

        // Use existing error handling utilities for other errors
        const errorStream = createErrorStream("Google", code, message);
        const reader = errorStream.getReader();

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            controller.enqueue(value);
          }
        } finally {
          reader.releaseLock();
        }

        controller.close();
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
    // Parse the Google error
    const { code, message, isQuotaError } = parseGoogleError(error);

    // Log appropriately based on error type
    if (isQuotaError) {
      console.warn("⚠️ Google API quota exceeded:", message);
    } else {
      console.error("❌ Google API error:", error);
    }

    // Handle quota exceeded errors specially
    if (isQuotaError) {
      let quotaMessage = "Google API quota exceeded. ";

      // Check if it's a free tier issue
      if (
        message.includes("doesn't have a free quota tier") ||
        message.includes("free_tier") ||
        message.includes("RESOURCE_EXHAUSTED")
      ) {
        const suggestedModel = suggestFreeModel(cleanModelId);
        quotaMessage += `The model '${cleanModelId}' requires a paid API plan. `;
        quotaMessage += `Try switching to '${suggestedModel}' or another free model like 'gemini-1.5-flash' or 'gemini-1.0-pro'.`;
      } else {
        quotaMessage +=
          "Please wait before making more requests or upgrade your quota.";
      }

      throw new Error(quotaMessage);
    }

    // Use existing error handling utilities for other errors
    throw createStandardError("Google", code, message);
  }
}
