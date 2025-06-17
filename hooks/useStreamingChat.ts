import { useCallback, useRef, useState } from "react";
import { Message } from "@/types/chat";
import { ChatSettings } from "@prisma/client";

interface ChatOptions {
  conversationId?: string;
  selectedModel?: string;
  provider?: string;
  model?: string;
  signal?: AbortSignal;
}

export const useStreamingChat = () => {
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendStreamingMessage = useCallback(
    async (
      messages: Message[],
      options: ChatOptions & {
        chatSettings?: ChatSettings | null;
        onMessageUpdate: (messageId: string, updates: Partial<Message>) => void;
        onConversationCreated?: (conversationId: string, title?: string) => void;
      }
    ) => {
      setIsLoading(true);

      // Create abort controller for this request
      abortControllerRef.current = new AbortController();

      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            messages,
            ...(options.conversationId && {
              conversationId: options.conversationId,
            }),
            selectedModel: {
              provider: options.provider || options.chatSettings?.provider || "openai",
              model: options.model || options.chatSettings?.model || "gpt-4o-mini",
            },
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `HTTP error! status: ${response.status} - ${errorText}`
          );
        }

        // Handle conversation ID and title from response headers
        const generatedTitle = response.headers.get("X-Generated-Title");
        const responseConversationId = response.headers.get("X-Conversation-Id");

        if (responseConversationId && !options.conversationId) {
          options.onConversationCreated?.(responseConversationId, generatedTitle || undefined);
        }

        // Handle streaming response
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        if (!reader) {
          throw new Error("No response body reader available");
        }

        // Create assistant message placeholder with unique ID
        const messageId = `assistant-${Date.now()}-${Math.random()
          .toString(36)
          .substr(2, 9)}`;
        
        const assistantMessage: Message = {
          id: messageId,
          role: "assistant",
          content: "",
          reasoning_content: "",
          partial_image: "",
          image_generation_status: "",
          provider: options.provider || options.chatSettings?.provider || "openai",
          model: options.model || options.chatSettings?.model || "gpt-4o-mini",
        };
        let done = false;
        let hasReceivedFirstToken = false;

        // Return the assistant message so it can be added to the messages array
        const streamPromise = (async () => {
          while (!done) {
            const { value, done: streamDone } = await reader.read();
            done = streamDone;

            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              const lines = chunk.split("\n");

              for (const line of lines) {
                if (line.startsWith("data: ")) {
                  const data = line.slice(6);

                  try {
                    const parsed = JSON.parse(data);

                    if (parsed.content) {
                      if (!hasReceivedFirstToken) {
                        setIsLoading(false);
                        hasReceivedFirstToken = true;
                      }

                      options.onMessageUpdate(messageId, {
                        content: assistantMessage.content + parsed.content,
                      });
                      assistantMessage.content += parsed.content;
                    }
                    if (parsed.reasoning) {
                      const newReasoningContent = (assistantMessage.reasoning_content || "") + parsed.reasoning;
                      options.onMessageUpdate(messageId, {
                        reasoning_content: newReasoningContent,
                      });
                      assistantMessage.reasoning_content = newReasoningContent;
                    }
                    if (parsed.partial_image) {
                      options.onMessageUpdate(messageId, {
                        partial_image: parsed.partial_image,
                        image_generation_status: "",
                      });
                      assistantMessage.partial_image = parsed.partial_image;
                      assistantMessage.image_generation_status = "";
                    }
                    if (parsed.image_generation_status) {
                      options.onMessageUpdate(messageId, {
                        image_generation_status: parsed.image_generation_status,
                      });
                      assistantMessage.image_generation_status = parsed.image_generation_status;
                    }
                  } catch {
                    // Skip invalid JSON chunks
                  }
                }
              }
            }
          }
        })();

        return { assistantMessage, streamPromise };
      } catch (error) {
        console.error("Error sending message:", error);
        throw error;
      } finally {
        // Ensure loading is always set to false when done
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    []
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  return {
    sendStreamingMessage,
    stopStream,
    isLoading,
  };
}; 