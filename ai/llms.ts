import { Message } from "@/types/chat";
import { GoogleGenAI } from "@google/genai";

// Types for API responses
interface OpenAIStreamResponse {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning?: string;
      reasoning_content?: string;
      thought?: string;
      thinking?: string;
    };
  }>;
}

interface OpenAINonStreamResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface AnthropicStreamResponse {
  type?: string;
  delta?: {
    text?: string;
  };
}

interface AnthropicNonStreamResponse {
  content?: Array<{
    text?: string;
  }>;
}

// Provider configuration
interface ProviderConfig {
  endpoint: string;
  headers: (apiKey: string) => Record<string, string>;
  transformMessages?: (messages: Message[]) => unknown;
  transformBody?: (messages: unknown, modelId: string) => unknown;
  parseStreamContent?: (
    parsed: unknown
  ) => { content?: string; reasoning?: string } | null;
  parseNonStreamContent?: (data: unknown) => string;
}

// OpenAI-compatible providers (OpenAI, XAI, OpenRouter)
const createOpenAICompatibleConfig = (
  endpoint: string,
  additionalHeaders: Record<string, string> = {},
  customStreamParser?: (
    parsed: unknown
  ) => { content?: string; reasoning?: string } | null
): ProviderConfig => ({
  endpoint,
  headers: (apiKey) => ({
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    ...additionalHeaders,
  }),
  transformMessages: (messages) =>
    messages.map((msg) => ({ role: msg.role, content: msg.content })),
  transformBody: (messages, modelId) => ({
    model: modelId,
    messages,
    temperature: 0.7,
    max_tokens: 4000,
    stream: true,
  }),
  parseStreamContent:
    customStreamParser ||
    ((parsed: unknown) => {
      const response = parsed as OpenAIStreamResponse;
      const content = response.choices?.[0]?.delta?.content;
      return content ? { content } : null;
    }),
  parseNonStreamContent: (data: unknown) => {
    const response = data as OpenAINonStreamResponse;
    return response.choices?.[0]?.message?.content?.trim() || "";
  },
});

const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  // OpenAI-compatible providers
  openai: createOpenAICompatibleConfig(
    "https://api.openai.com/v1/chat/completions"
  ),

  xai: createOpenAICompatibleConfig("https://api.x.ai/v1/chat/completions"),

  openrouter: createOpenAICompatibleConfig(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      "HTTP-Referer":
        process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
      "X-Title": "OSS T3 Chat",
    },
    // Custom parser for OpenRouter reasoning content
    (parsed: unknown) => {
      const response = parsed as OpenAIStreamResponse;
      const delta = response.choices?.[0]?.delta;
      if (!delta) return null;

      const result: { content?: string; reasoning?: string } = {};

      // Handle different reasoning content formats
      const reasoningContent =
        delta.reasoning ||
        delta.reasoning_content ||
        delta.thought ||
        delta.thinking;
      if (reasoningContent) {
        result.reasoning = reasoningContent;
      }

      if (delta.content) {
        result.content = delta.content;
      }

      return Object.keys(result).length > 0 ? result : null;
    }
  ),

  // Special providers with different APIs
  anthropic: {
    endpoint: "https://api.anthropic.com/v1/messages",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    transformMessages: (messages) => {
      const systemMessage = messages.find((m) => m.role === "system");
      const conversationMessages = messages.filter((m) => m.role !== "system");
      return {
        system: systemMessage?.content || "You are a helpful assistant.",
        messages: conversationMessages.map((msg) => ({
          role: msg.role === "assistant" ? "assistant" : "user",
          content: msg.content,
        })),
      };
    },
    transformBody: (messages: unknown, modelId: string) => {
      const { system, messages: msgs } = messages as {
        system: string;
        messages: unknown;
      };
      return {
        model: modelId,
        max_tokens: 4000,
        system,
        messages: msgs,
        stream: true,
      };
    },
    parseStreamContent: (parsed: unknown) => {
      const response = parsed as AnthropicStreamResponse;
      if (response.type === "content_block_delta" && response.delta?.text) {
        return { content: response.delta.text };
      }
      return null;
    },
    parseNonStreamContent: (data: unknown) => {
      const response = data as AnthropicNonStreamResponse;
      return response.content?.[0]?.text?.trim() || "";
    },
  },

  deepseek: createOpenAICompatibleConfig(
    "https://api.deepseek.com/v1/chat/completions",
    {},
    // Custom parser for DeepSeek reasoning content
    (parsed: unknown) => {
      const response = parsed as OpenAIStreamResponse;
      const delta = response.choices?.[0]?.delta;
      if (!delta) return null;

      const result: { content?: string; reasoning?: string } = {};

      if (delta.reasoning_content) {
        result.reasoning = delta.reasoning_content;
      }

      if (delta.content) {
        result.content = delta.content;
      }

      return Object.keys(result).length > 0 ? result : null;
    }
  ),
};

// Common error handling
function createErrorStream(
  providerName: string,
  status: number,
  errorText: string
): ReadableStream {
  let userFriendlyError = `${providerName} API error: ${status}`;

  try {
    const errorData = JSON.parse(errorText);
    if (errorData.error?.message) {
      userFriendlyError = errorData.error.message;
    }
  } catch {
    userFriendlyError = errorText || userFriendlyError;
  }

  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({
            content: `❌ **Error**: ${userFriendlyError}`,
          })}\n\n`
        )
      );
      controller.close();
    },
  });
}

// Generic streaming function
async function callProviderStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  config: ProviderConfig,
  providerName: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  const transformedMessages = config.transformMessages
    ? config.transformMessages(messages)
    : messages;
  const body = config.transformBody
    ? config.transformBody(transformedMessages, modelId)
    : transformedMessages;

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: config.headers(apiKey),
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    return createErrorStream(providerName, response.status, errorText);
  }

  return new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        controller.error(new Error("No response body reader"));
        return;
      }

      let buffer = ""; // Buffer for incomplete chunks

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          // Append new chunk to buffer
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete lines
          const lines = buffer.split("\n");
          // Keep the last potentially incomplete line in buffer
          buffer = lines.pop() || "";

          for (const line of lines) {
            const trimmedLine = line.trim();
            if (!trimmedLine) continue;

            if (trimmedLine.startsWith("data: ")) {
              const data = trimmedLine.slice(6).trim();

              if (data === "[DONE]") {
                controller.close();
                return;
              }

              if (!data || data.length === 0) continue;

              try {
                const parsed = JSON.parse(data);
                const result = config.parseStreamContent
                  ? config.parseStreamContent(parsed)
                  : null;

                if (result) {
                  if (result.reasoning) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          reasoning: result.reasoning,
                        })}\n\n`
                      )
                    );
                  }

                  if (result.content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          content: result.content,
                        })}\n\n`
                      )
                    );
                  }
                }
              } catch (e) {
                // Only log JSON parsing errors for debugging, but continue processing
                if (process.env.NODE_ENV === "development") {
                  console.debug(`⚠️ ${providerName} JSON parse error (likely incomplete chunk):`, (e as Error).message);
                }
                // Skip invalid JSON chunks - normal in streaming
                continue;
              }
            }
          }
        }

        // Process any remaining data in buffer
        if (buffer.trim()) {
          const trimmedBuffer = buffer.trim();
          if (trimmedBuffer.startsWith("data: ")) {
            const data = trimmedBuffer.slice(6).trim();
            if (data && data !== "[DONE]") {
              try {
                const parsed = JSON.parse(data);
                const result = config.parseStreamContent
                  ? config.parseStreamContent(parsed)
                  : null;

                if (result) {
                  if (result.reasoning) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          reasoning: result.reasoning,
                        })}\n\n`
                      )
                    );
                  }

                  if (result.content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          content: result.content,
                        })}\n\n`
                      )
                    );
                  }
                }
                             } catch (e) {
                 // Final chunk might be incomplete, ignore parsing errors
                 if (process.env.NODE_ENV === "development") {
                   console.debug(`⚠️ ${providerName} final chunk parse error:`, (e as Error).message);
                 }
              }
            }
          }
        }

        controller.close();
      } catch (error) {
        console.error(`💥 ${providerName} stream error:`, error);
        controller.error(error);
      }
    },
  });
}

// Generic non-streaming function
async function callProviderNonStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  config: ProviderConfig,
  providerName: string,
  maxTokens: number = 50
): Promise<string> {
  const transformedMessages = config.transformMessages
    ? config.transformMessages(messages)
    : messages;
  let body = config.transformBody
    ? config.transformBody(transformedMessages, modelId)
    : transformedMessages;

  // Override max_tokens and temperature for title generation
  if (typeof body === "object" && body !== null) {
    body = { ...body, max_tokens: maxTokens, temperature: 0.3, stream: false };
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: config.headers(apiKey),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `${providerName} API error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  return config.parseNonStreamContent ? config.parseNonStreamContent(data) : "";
}

// Generic streaming function for all providers (except Google which uses different SDK)

// Google streaming function (kept separate due to different SDK)
async function callGoogleStreaming(
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
        // Convert messages to Google format
        const systemMessage = messages.find((m) => m.role === "system");
        const conversationMessages = messages.filter(
          (m) => m.role !== "system"
        );

        // Create the prompt from messages
        let prompt = "";
        if (systemMessage) {
          prompt += systemMessage.content + "\n\n";
        }

        // Add conversation history
        for (const msg of conversationMessages) {
          if (msg.role === "user") {
            prompt += `User: ${msg.content}\n`;
          } else if (msg.role === "assistant") {
            prompt += `Assistant: ${msg.content}\n`;
          }
        }

        // Configure the request
        const requestConfig: {
          model: string;
          contents: string;
          config?: {
            thinkingConfig?: {
              includeThoughts?: boolean;
            };
          };
        } = {
          model: cleanModelId,
          contents: prompt.trim(),
        };

        // Add thinking config for thinking models
        if (isThinkingModel) {
          requestConfig.config = {
            thinkingConfig: {
              includeThoughts: true,
            },
          };
        }

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

// Generic non-streaming function for all providers (except Google which uses different SDK)

async function callGoogleNonStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string
): Promise<string> {
  // Remove both "google/" prefix and ":thinking" suffix
  const cleanModelId = modelId.replace("google/", "").replace(":thinking", "");

  const ai = new GoogleGenAI({ apiKey });

  try {
    // Convert messages to Google format
    const systemMessage = messages.find((m) => m.role === "system");
    const conversationMessages = messages.filter((m) => m.role !== "system");

    // Create the prompt from messages
    let prompt = "";
    if (systemMessage) {
      prompt += systemMessage.content + "\n\n";
    }

    // Add conversation history
    for (const msg of conversationMessages) {
      if (msg.role === "user") {
        prompt += `User: ${msg.content}\n`;
      } else if (msg.role === "assistant") {
        prompt += `Assistant: ${msg.content}\n`;
      }
    }

    // Use the generateContent method for non-streaming
    const response = await ai.models.generateContent({
      model: cleanModelId,
      contents: prompt.trim(),
    });

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

export async function generateTitle(
  userMessage: string,
  provider: string,
  modelId: string,
  apiKey: string
): Promise<string> {
  const titlePrompt: Message[] = [
    {
      role: "system",
      content:
        "Generate a concise, descriptive title (3-6 words) for this conversation based on the user's first message. Return only the title, no quotes or additional text.",
      timestamp: new Date(),
    },
    {
      role: "user",
      content: `User message: "${userMessage}"`,
      timestamp: new Date(),
    },
  ];

  try {
    let title: string;

    // If model has a "/" in it, it's an OpenRouter model regardless of provider
    const actualProvider = modelId.includes("/") ? "openrouter" : provider;

    // Map complex reasoning models to simpler alternatives for title generation
    let titleModelId = modelId;

    if (actualProvider === "openrouter") {
      // Map OpenRouter reasoning models to simpler alternatives
      if (
        modelId.includes("o1") ||
        modelId.includes("o4") ||
        modelId.includes("reasoning") ||
        modelId.includes("qwq")
      ) {
        titleModelId = "openai/gpt-4o-mini"; // Fast, reliable OpenAI model via OpenRouter
      } else if (modelId.includes("claude") && modelId.includes("3.5")) {
        titleModelId = "anthropic/claude-3-5-haiku-20241022"; // Fast Claude model
      } else if (modelId.includes("deepseek") && modelId.includes("reasoner")) {
        titleModelId = "deepseek/deepseek-chat"; // Simpler DeepSeek model
      }
    } else {
      // Map direct provider reasoning models to simpler alternatives
      switch (actualProvider.toLowerCase()) {
        case "openai":
          if (modelId.includes("o1")) {
            titleModelId = "gpt-4o-mini";
          }
          break;
        case "anthropic":
          if (modelId.includes("opus")) {
            titleModelId = "claude-3-5-haiku-20241022";
          }
          break;
        case "deepseek":
          if (modelId.includes("reasoner")) {
            titleModelId = "deepseek-chat";
          }
          break;
      }
    }

    // Handle Google separately due to different SDK
    if (actualProvider.toLowerCase() === "google") {
      title = await callGoogleNonStreaming(titlePrompt, titleModelId, apiKey);
    } else {
      // Use generic provider non-streaming for all other providers
      const config = PROVIDER_CONFIGS[actualProvider.toLowerCase()] || PROVIDER_CONFIGS.openrouter;
      const providerName = actualProvider.charAt(0).toUpperCase() + actualProvider.slice(1);
      
      title = await callProviderNonStreaming(
        titlePrompt,
        titleModelId,
        apiKey,
        config,
        providerName
      );
    }

    // Clean up the title (remove quotes, limit length)
    title = title.replace(/^["']|["']$/g, "").trim();
    if (title.length > 50) {
      title = title.substring(0, 47) + "...";
    }

    return title || "New Conversation";
  } catch (error) {
    console.error("❌ Title generation error:", error);
    // Fallback to simple title generation
    const words = userMessage.split(" ").slice(0, 4);
    return words.join(" ") + (userMessage.split(" ").length > 4 ? "..." : "");
  }
}

export async function handleLLMRequestStreaming(
  messages: Message[],
  provider: string,
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  // Add system message if not present
  const messagesWithSystem = messages.some((m) => m.role === "system")
    ? messages
    : [
        {
          role: "system",
          content: "You are a helpful assistant.",
          timestamp: new Date(),
        } as Message,
        ...messages,
      ];

  // If model has a "/" in it, it's an OpenRouter model regardless of provider
  const actualProvider = modelId.includes("/") ? "openrouter" : provider;

  // Handle Google separately due to different SDK
  if (actualProvider.toLowerCase() === "google") {
    return await callGoogleStreaming(
      messagesWithSystem,
      modelId,
      apiKey,
      signal
    );
  }

  // Use generic provider streaming for all other providers
  const config =
    PROVIDER_CONFIGS[actualProvider.toLowerCase()] ||
    PROVIDER_CONFIGS.openrouter;
  const providerName =
    actualProvider.charAt(0).toUpperCase() + actualProvider.slice(1);

  return await callProviderStreaming(
    messagesWithSystem,
    modelId,
    apiKey,
    config,
    providerName,
    signal
  );
}
