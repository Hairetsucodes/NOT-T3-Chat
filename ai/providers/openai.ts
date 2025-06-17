import { Message } from "@/types/chat";
import OpenAI from "openai";
import { imageCapableModels } from "@/constants/imageModels";
import {
  parseOpenAIError,
  createModelAccessErrorMessage,
  createRateLimitErrorMessage,
} from "../utils/errors";
import {
  deletePartialImagesFromLocal,
  uploadAttachmentToLocal,
} from "@/fileStorage/local";
import {
  deletePartialImagesFromAzure,
  uploadAttachmentToAzure,
} from "@/fileStorage/azure";

const isLocal = process.env.AZURE_STORAGE_CONNECTION_STRING === undefined;

const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

export async function callOpenAIStreaming(
  userId: string,
  messages: Message[],
  modelId: string,
  apiKey: string,
  isImageGeneration?: boolean,
  lastResponseId?: string
): Promise<ReadableStream> {
  const openai = new OpenAI({
    apiKey,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tools: any[] = [];
  const noTimestampMessages = messages.map((message) => {
    return {
      role: message.role,
      content: message.content,
    };
  });

  if (isImageGeneration && imageCapableModels.includes(modelId)) {
    tools = [
      {
        type: "image_generation",
        size: "auto",
        quality: "high",
        output_format: "png",
        background: "auto",
        moderation: "auto",
        partial_images: 3,
      },
    ];
  }

  try {
    const stream = await openai.responses.create({
      model: modelId,
      input: noTimestampMessages,
      stream: true,
      previous_response_id: lastResponseId,
      tools: tools,
    });

    return new ReadableStream({
      async start(controller) {
        try {
          for await (const event of stream) {
            if (event.type === "response.output_text.delta") {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({ content: event.delta })}\n\n`
                )
              );
            }
            if (event.type === "response.image_generation_call.in_progress") {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    image_generation_status: "Starting image generation...",
                  })}\n\n`
                )
              );
            }
            if (event.type === "response.image_generation_call.generating") {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    image_generation_status: "Image generation in progress...",
                  })}\n\n`
                )
              );
            }
            if (event.type === "response.image_generation_call.partial_image") {
              // save to temp file
              const iteration = event.partial_image_index;
              const filename = `partial-${userId}-${iteration}${Date.now()}.png`;
              
              // Convert base64 to binary data
              const binaryData = Uint8Array.from(atob(event.partial_image_b64), c => c.charCodeAt(0));
              
              if (isLocal) {
                uploadAttachmentToLocal(
                  new File([binaryData], filename, {
                    type: "image/png",
                  }),
                  filename,
                  userId
                );
              } else {
                uploadAttachmentToAzure(
                  new File([binaryData], filename, {
                    type: "image/png",
                  }),
                  filename,
                  "image/png",
                  userId
                );
              }
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    partial_image: `![${filename}](${`${baseUrl}/api/images/${filename}`}) `,
                  })}\n\n`
                )
              );
            }

            if (
              event.type === "response.output_item.done" &&
              event.item.type === "image_generation_call"
            ) {
              const imageBase64 = event.item.result as string;
              const timestamp = Date.now();
              const filename = `${timestamp}.png`;
              
              // Convert base64 to binary data
              const binaryData = Uint8Array.from(atob(imageBase64), c => c.charCodeAt(0));
              
              if (isLocal) {
                uploadAttachmentToLocal(
                  new File([binaryData], filename, {
                    type: "image/png",
                  }),
                  filename,
                  userId
                );
              } else {
                uploadAttachmentToAzure(
                  new File([binaryData], filename, {
                    type: "image/png",
                  }),
                  filename,
                  "image/png",
                  userId
                );
              }
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    partial_image: `![${filename}](${`${baseUrl}/api/images/${userId}-${filename}`}) [Download](${`${baseUrl}/api/images/${userId}-${filename}?download=true`})\n\n `,
                    image_url: `![${filename}](${`${baseUrl}/api/images/${userId}-${filename}`}) [Download](${`${baseUrl}/api/images/${userId}-${filename}?download=true`})\n\n `,
                  })}\n\n`
                )
              );
            }
            if (event.type === "response.completed") {
              controller.enqueue(
                new TextEncoder().encode(
                  `data: ${JSON.stringify({
                    previous_response_id: event.response.id,
                  })}\n\n`
                )
              );
              if (isLocal) {
                deletePartialImagesFromLocal(userId);
              } else {
                deletePartialImagesFromAzure(userId);
              }
            }
          }
          controller.close();
        } catch (error) {
          // Parse the error and create appropriate user-friendly message
          const { message, isModelAccessError, isRateLimitError } =
            parseOpenAIError(error);

          let userFriendlyMessage: string;

          if (isModelAccessError) {
            userFriendlyMessage = createModelAccessErrorMessage(
              modelId,
              message
            );
          } else if (isRateLimitError) {
            userFriendlyMessage = createRateLimitErrorMessage(message);
          } else {
            userFriendlyMessage = `❌ **OpenAI API Error**: ${message}`;
          }

          // Stream the error message
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ content: userFriendlyMessage })}\n\n`
            )
          );
          controller.close();
        }
      },
    });
  } catch (error) {
    // Handle errors that occur before streaming starts
    const { message, isModelAccessError, isRateLimitError } =
      parseOpenAIError(error);

    let userFriendlyMessage: string;

    if (isModelAccessError) {
      userFriendlyMessage = createModelAccessErrorMessage(modelId, message);
    } else if (isRateLimitError) {
      userFriendlyMessage = createRateLimitErrorMessage(message);
    } else {
      userFriendlyMessage = `❌ **OpenAI API Error**: ${message}`;
    }

    return new ReadableStream({
      start(controller) {
        controller.enqueue(
          new TextEncoder().encode(
            `data: ${JSON.stringify({ content: userFriendlyMessage })}\n\n`
          )
        );
        controller.close();
      },
    });
  }
}

export async function callOpenAINonStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  maxTokens: number = 50
): Promise<string> {
  const openai = new OpenAI({
    apiKey,
  });

  // Transform messages to OpenAI format
  const openAIMessages = messages.map((message) => ({
    role: message.role as "system" | "user" | "assistant",
    content: message.content,
  }));

  try {
    const response = await openai.responses.create({
      model: modelId,
      input: openAIMessages,
      max_output_tokens: maxTokens,
      temperature: 0.3,
      stream: false,
    });

    const content = response.output_text?.trim() || "";

    return content;
  } catch (error) {
    const { message, isModelAccessError, isRateLimitError } =
      parseOpenAIError(error);

    let userFriendlyMessage: string;

    if (isModelAccessError) {
      userFriendlyMessage = createModelAccessErrorMessage(modelId, message);
    } else if (isRateLimitError) {
      userFriendlyMessage = createRateLimitErrorMessage(message);
    } else {
      userFriendlyMessage = `OpenAI API Error: ${message}`;
    }

    throw new Error(userFriendlyMessage);
  }
}
