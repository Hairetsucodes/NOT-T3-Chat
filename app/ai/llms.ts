import { Message } from "@/types/chat";
import { GoogleGenAI } from "@google/genai";

interface ProviderResponse {
  id: string;
  messages: Message[];
  title: string;
  content: string;
  reasoning_content?: string;
  reasoning?: string;
  aborted: boolean;
}

// Streaming LLM communication functions
async function callOpenAIStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  return new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        controller.error(new Error("No response body reader"));
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({ content })}\n\n`
                    )
                  );
                }
              } catch (e) {
                console.error("❌ OpenAI API error:", e);
                // Skip invalid JSON
              }
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

async function callAnthropicStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  // Convert messages for Anthropic format
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4000,
      system: systemMessage?.content || "You are a helpful assistant.",
      messages: conversationMessages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  return new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        controller.error(new Error("No response body reader"));
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              try {
                const parsed = JSON.parse(data);
                if (
                  parsed.type === "content_block_delta" &&
                  parsed.delta?.text
                ) {
                  controller.enqueue(
                    new TextEncoder().encode(
                      `data: ${JSON.stringify({
                        content: parsed.delta.text,
                      })}\n\n`
                    )
                  );
                }
              } catch (e) {
                console.error("❌ Anthropic API error:", e);
                // Skip invalid JSON
              }
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

export async function handleLLMRequestStreaming(
  messages: Message[],
  provider: string,
  modelId: string,
  apiKey: string,
  conversationId: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  console.log("🚀 Handling streaming LLM request:", {
    provider,
    model: modelId,
    conversationId,
    messageCount: messages.length,
  });

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

  switch (provider.toLowerCase()) {
    case "openai":
      return await callOpenAIStreaming(
        messagesWithSystem,
        modelId,
        apiKey,
        signal
      );

    case "anthropic":
      return await callAnthropicStreaming(
        messagesWithSystem,
        modelId,
        apiKey,
        signal
      );

    case "google":
      return await callGoogleStreaming(
        messagesWithSystem,
        modelId,
        apiKey,
        signal
      );

    case "deepseek":
      return await callDeepSeekStreaming(
        messagesWithSystem,
        modelId,
        apiKey,
        signal
      );

    case "xai":
    default:
      // Route unsupported providers through OpenRouter
      return await callOpenRouterStreaming(
        messagesWithSystem,
        modelId,
        apiKey,
        signal
      );
  }
}

// Keep the original non-streaming version for backward compatibility
export async function handleLLMRequest(
  messages: Message[],
  provider: string,
  modelId: string,
  apiKey: string,
  conversationId: string,
  signal?: AbortSignal
): Promise<ProviderResponse> {
  try {
    console.log("🚀 Handling LLM request:", {
      provider,
      model: modelId,
      conversationId,
      messageCount: messages.length,
    });

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

    let content = "";
    let reasoning = "";

    switch (provider.toLowerCase()) {
      case "openai":
        content = await callOpenAI(messagesWithSystem, modelId, apiKey, signal);
        break;

      case "anthropic":
        content = await callAnthropic(
          messagesWithSystem,
          modelId,
          apiKey,
          signal
        );
        break;

      case "google":
        const googleResult = await callGoogle(
          messagesWithSystem,
          modelId,
          apiKey,
          signal
        );
        content = googleResult.content;
        reasoning = googleResult.reasoning || "";
        break;

      case "deepseek":
        const deepseekResult = await callDeepSeek(
          messagesWithSystem,
          modelId,
          apiKey,
          signal
        );
        content = deepseekResult.content;
        reasoning = deepseekResult.reasoning || "";
        break;

      case "xai":
      default:
        // Route unsupported providers through OpenRouter
        content = await callOpenRouter(
          messagesWithSystem,
          modelId,
          apiKey,
          signal
        );
        break;
    }

    const assistantMessage: Message = {
      role: "assistant",
      content,
      timestamp: new Date(),
    };

    // Add reasoning content if available
    if (reasoning) {
      assistantMessage.reasoning_content = reasoning;
    }

    return {
      id: conversationId || "response",
      messages: [...messagesWithSystem, assistantMessage],
      title: "Chat Response",
      content,
      reasoning,
      reasoning_content: reasoning,
      aborted: false,
    };
  } catch (error: unknown) {
    console.error("❌ LLM request failed:", error);

    let errorMessage = "An unexpected error occurred.";

    if (error instanceof Error) {
      // Handle API key related errors
      if (
        error.message.includes("API key") ||
        error.message.includes("401") ||
        error.message.includes("403")
      ) {
        errorMessage =
          "Invalid API key. Please check your API key in Settings.";
      }
      // Handle aborted requests
      else if (
        error.message.includes("aborted") ||
        error.name === "AbortError"
      ) {
        errorMessage = "The request was cancelled.";
      }
      // Use the actual error message for other cases
      else {
        errorMessage = error.message;
      }
    }

    const newMessage = {
      role: "assistant",
      content: errorMessage,
      timestamp: new Date(),
    } as Message;

    return {
      id: "error",
      messages: [...messages, newMessage],
      title: "Error",
      content: errorMessage,
      aborted: error instanceof Error && error.name === "AbortError",
    };
  }
}

// Non-streaming LLM functions (used by handleLLMRequest)
async function callOpenAI(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 4000,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function callAnthropic(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<string> {
  // Convert messages for Anthropic format
  const systemMessage = messages.find((m) => m.role === "system");
  const conversationMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4000,
      system: systemMessage?.content || "You are a helpful assistant.",
      messages: conversationMessages.map((msg) => ({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      })),
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.content[0]?.text || "";
}

async function callOpenRouter(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<string> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "OSS T3 Chat",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 4000,
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  return data.choices[0]?.message?.content || "";
}

async function callDeepSeek(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<{ content: string; reasoning?: string }> {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 4000,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const message = data.choices[0]?.message;

  return {
    content: message?.content || "",
    reasoning: message?.reasoning_content || "",
  };
}

async function callGoogle(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<{ content: string; reasoning?: string }> {
  // Remove both "google/" prefix and ":thinking" suffix
  const cleanModelId = modelId.replace("google/", "").replace(":thinking", "");
  const isThinkingModel = modelId.includes(":thinking");

  // Convert messages for Google format
  const contents = messages
    .filter((msg) => msg.role !== "system")
    .map((msg) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }],
    }));

  const requestBody: {
    contents: {
      role: string;
      parts: { text: string }[];
    }[];
    generationConfig: {
      temperature: number;
      maxOutputTokens: number;
    };
    config?: {
      thinkingConfig?: {
        includeThoughts?: boolean;
      };
    };
  } = {
    contents,
    generationConfig: {
      temperature: 0.7,
      maxOutputTokens: 4000,
    },
  };

  // Add thinking config for thinking models
  if (isThinkingModel) {
    requestBody.config = {
      thinkingConfig: {
        includeThoughts: true,
      },
    };
  }

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${cleanModelId}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Google AI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const candidate = data.candidates?.[0];

  if (!candidate) {
    throw new Error("No response from Google AI");
  }

  let content = "";
  let reasoning = "";

  // Extract content and reasoning from parts
  const parts = candidate.content?.parts || [];
  for (const part of parts) {
    if (part.text) {
      if (part.thought) {
        reasoning += (reasoning ? "\n\n" : "") + part.text;
      } else {
        content += part.text;
      }
    }
  }

  return { content, reasoning };
}

async function callOpenRouterStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        "HTTP-Referer":
          process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
        "X-Title": "OSS T3 Chat",
      },
      body: JSON.stringify({
        model: modelId,
        messages: messages.map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: 0.7,
        max_tokens: 4000,
        stream: true,
      }),
      signal,
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
  }

  return new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        controller.error(new Error("No response body reader"));
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });

          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);

              if (data === "[DONE]") {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);

                const delta = parsed.choices?.[0]?.delta;
                if (delta) {
                  // Handle reasoning content
                  if (delta.reasoning) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          reasoning: delta.reasoning,
                        })}\n\n`
                      )
                    );
                  }

                  // Handle regular content
                  if (delta.content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          content: delta.content,
                        })}\n\n`
                      )
                    );
                  }

                  if (!delta.content && !delta.reasoning) {
                  }
                } else {
                }
              } catch (e) {
                console.error(
                  "❌ OpenRouter JSON parse error:",
                  e,
                  "Data:",
                  data
                );
                // Skip invalid JSON
              }
            }
          }
        }
        controller.close();
      } catch (error) {
        console.error("💥 OpenRouter stream error:", error);
        controller.error(error);
      }
    },
  });
}

async function callDeepSeekStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  signal?: AbortSignal
): Promise<ReadableStream> {
  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelId,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature: 0.7,
      max_tokens: 4000,
      stream: true,
    }),
    signal,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
  }

  return new ReadableStream({
    async start(controller) {
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        controller.error(new Error("No response body reader"));
        return;
      }

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim());

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              const data = line.slice(6);
              if (data === "[DONE]") {
                controller.close();
                return;
              }

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;

                if (delta) {
                  // Handle reasoning content for deepseek-reasoner model
                  if (delta.reasoning_content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          reasoning: delta.reasoning_content,
                        })}\n\n`
                      )
                    );
                  }

                  // Handle regular content
                  if (delta.content) {
                    controller.enqueue(
                      new TextEncoder().encode(
                        `data: ${JSON.stringify({
                          content: delta.content,
                        })}\n\n`
                      )
                    );
                  }
                }
              } catch (e) {
                console.error("❌ DeepSeek API error:", e);
                // Skip invalid JSON
              }
            }
          }
        }
        controller.close();
      } catch (error) {
        controller.error(error);
      }
    },
  });
}

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

// Note: The old chatRequest function has been replaced with handleLLMRequest
// which takes the API key directly instead of calling back to the API route
