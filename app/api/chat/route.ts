import { auth } from "@/auth";
import { handleLLMRequestStreaming, generateTitle } from "@/ai/index";
import { ChatRequestSchema } from "@/schemas/chatEndpoint";
import { getChatSettings } from "@/data/settings";
import { getModelById } from "@/data/models";
import { prisma } from "@/prisma";
import { z } from "zod";

const createMessageApi = async (
  userId: string,
  content: string,
  role: string,
  provider: string,
  modelId: string,
  reasoningContent: string,
  conversationId?: string,
  title?: string
) => {
  // Create conversation if it doesn't exist
  if (!conversationId) {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || "New Conversation",
      },
    });
    conversationId = conversation.id;
  }

  // Validate required fields
  if (!content) {
    throw new Error("Content is required");
  }
  if (!role) {
    throw new Error("Role is required");
  }

  // Create and return the message
  const message = await prisma.message.create({
    data: {
      userId,
      conversationId,
      content,
      role,
      provider,
      model: modelId,
      reasoningContent,
    },
  });

  return message;
};

export const maxDuration = 30;
const getPrompt = async (promptId: string, userId: string) => {
  const prompt = await prisma.prompt.findFirst({
    where: { id: promptId, userId },
  });

  return prompt;
};

const getAPIKeys = async (userId: string) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: userId,
      },
    });
    return apiKeys;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid user ID");
    }
    throw new Error("Failed to fetch API keys");
  }
};

export async function POST(req: Request) {
  // Parse and validate JSON body
  let body;
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON format" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Validate request body structure
  const validationResult = ChatRequestSchema.safeParse(body);
  if (!validationResult.success) {
    return new Response(
      JSON.stringify({
        error: "Invalid request format",
        details: validationResult.error.errors.map((err) => ({
          field: err.path.join("."),
          message: err.message,
        })),
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const { messages, conversationId, selectedModel } = validationResult.data;

  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  try {
    const apiKeys = await getAPIKeys(userId);
    const settings = await getChatSettings();
    const prompt =
      !settings || "error" in settings || !settings.promptId
        ? null
        : await getPrompt(settings.promptId, userId);
    // Determine provider from selectedModel or default to openai
    let provider = selectedModel?.provider || "openai";
    const modelId = selectedModel?.model || "gpt-4o-mini";

    // If model has a "/" in it, it's an OpenRouter model regardless of provider
    if (modelId.includes("/")) {
      provider = "openrouter";
    }
    // Find the appropriate API key for the provider
    let providerKey = apiKeys.find((key) => key.provider === provider);

    // For unsupported providers (not openai, anthropic, google, xai, deepseek), use OpenRouter
    if (
      !providerKey &&
      ![
        "openai",
        "anthropic",
        "google",
        "xai",
        "deepseek",
        "openrouter",
      ].includes(provider)
    ) {
      providerKey = apiKeys.find((key) => key.provider === "openrouter");
      if (!providerKey) {
        return new Response(
          JSON.stringify({
            error:
              "OpenRouter API key not found. This model requires an OpenRouter API key. Please add your OpenRouter API key in settings.",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }
    } else if (!providerKey) {
      return new Response(
        JSON.stringify({
          error: `${
            provider.charAt(0).toUpperCase() + provider.slice(1)
          } API key not found. Please add your ${
            provider.charAt(0).toUpperCase() + provider.slice(1)
          } API key in settings.`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Generate title for new conversations (without conversationId)
    let generatedTitle = null;
    if (!conversationId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === "user") {
        try {
          // Use LLM to generate a meaningful title with the corrected provider
          generatedTitle = await generateTitle(
            lastUserMessage.content,
            provider,
            modelId,
            providerKey.key
          );
        } catch (error) {
          console.error("❌ Title generation failed, using fallback:", error);
          // Fallback to simple title generation
          const words = lastUserMessage.content.split(" ").slice(0, 4);
          generatedTitle =
            words.join(" ") +
            (lastUserMessage.content.split(" ").length > 4 ? "..." : "");
        }
      }
    }

    // Save the user message and create/get conversation
    let currentConversationId: string | undefined = conversationId || undefined;
    const lastUserMessage = messages[messages.length - 1];

    if (lastUserMessage?.role === "user") {
      const savedMessage = await createMessageApi(
        userId,
        lastUserMessage.content,
        "user",
        provider,
        modelId,
        "",
        currentConversationId,
        generatedTitle || undefined
      );
      // If this was a new conversation, get the conversationId
      if (!currentConversationId && savedMessage) {
        currentConversationId = savedMessage.conversationId;
      }
    }

    // Get model information to determine max tokens
    const modelInfo = await getModelById(modelId);
    const maxTokens = modelInfo?.maxOutput || undefined;

    // Get streaming response from handleLLMRequestStreaming
    const stream = await handleLLMRequestStreaming(
      messages,
      provider,
      modelId,
      providerKey.key,
      (prompt && "prompt" in prompt ? prompt.prompt : "") || "",
      new AbortController().signal,
      maxTokens
    );

    // Wrap the stream to accumulate content and save to database when complete
    let fullContent = "";
    let fullReasoning = "";
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
                    provider,
                    modelId,
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
                        // Only parse non-empty data
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

    // Return streaming response with conversation metadata in headers
    // Use cache headers that don't completely block bfcache
    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, max-age=0, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    };

    // Include generated title and conversation ID in response headers
    if (generatedTitle) {
      responseHeaders["X-Generated-Title"] = generatedTitle;
    }
    if (currentConversationId) {
      responseHeaders["X-Conversation-Id"] = currentConversationId;
    }

    return new Response(transformedStream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
