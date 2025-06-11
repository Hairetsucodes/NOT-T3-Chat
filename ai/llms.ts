import { Message } from "@/types/chat";
import { GoogleGenAI } from "@google/genai";



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