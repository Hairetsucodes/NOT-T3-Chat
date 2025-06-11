import { createOpenAI } from "@ai-sdk/openai";
import { streamText, wrapLanguageModel, generateText } from "ai";
import { auth } from "@/auth";
import { getAPIKeys } from "@/data/apikeys";
import { createCacheMiddleware } from "@/lib/middleware/cache";
import { createMessage } from "@/data/messages";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, conversationId } = await req.json();

  const session = await auth();

  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const apiKeys = await getAPIKeys(session.user.id);
    const openaiKey = apiKeys.find((key) => key.provider === "openai");

    if (!openaiKey) {
      return new Response(
        "OpenAI API key not found. Please add your OpenAI API key in settings.",
        { status: 400 }
      );
    }

    const openai = createOpenAI({
      apiKey: openaiKey.key,
    });

    const baseModel = openai("gpt-4o");
    const cachedModel = wrapLanguageModel({
      model: baseModel,
      middleware: [createCacheMiddleware(session.user.id)],
    });

    // Generate title for new conversations (without conversationId)
    let generatedTitle = null;
    if (!conversationId && messages.length > 0) {
      const lastUserMessage = messages[messages.length - 1];
      if (lastUserMessage?.role === "user") {
        try {
          const titleResult = await generateText({
            model: baseModel,
            messages: [
              {
                role: "system",
                content:
                  "Generate a short, concise title (3-6 words) for this conversation based on the user's message. Only return the title, nothing else.",
              },
              {
                role: "user",
                content: lastUserMessage.content,
              },
            ],
            maxTokens: 20,
            temperature: 0.3,
          });
          generatedTitle = titleResult.text;
        } catch (error) {
          console.error("Title generation failed:", error);
          // Fallback to a default title
          generatedTitle = "New Conversation";
        }
      }
    }

    // Save the user message and create/get conversation
    let currentConversationId: string | undefined = conversationId;
    const lastUserMessage = messages[messages.length - 1];
    
    if (lastUserMessage?.role === "user") {
      const savedMessage = await createMessage(
        session.user.id,
        lastUserMessage.content,
        "user",
        "openai",
        "",
        currentConversationId,
        generatedTitle || undefined
      );
      // If this was a new conversation, get the conversationId
      if (!currentConversationId && savedMessage) {
        currentConversationId = savedMessage.conversationId;
      }
    }

    const optimizedMessages = [
      {
        role: "system" as const,
        content: "You are a helpful assistant.",
      },
      ...messages,
    ];

    const result = streamText({
      model: cachedModel,
      messages: optimizedMessages,
      temperature: 0.7,
      maxTokens: 4000,
      onFinish: async (result) => {
        // Save the assistant's response when streaming finishes
        try {
          if (currentConversationId && result.text) {
            await createMessage(
              session.user.id,
              result.text,
              "assistant",
              "openai",
              "",
              currentConversationId
            );
          }
        } catch (error) {
          console.error("Failed to save assistant message:", error);
        }
      },
    });

    // Create response headers with conversation data immediately
    const responseHeaders: Record<string, string> = {
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "X-Cache-Optimized": "true",
    };

    // Include generated title and conversation ID in response headers immediately
    if (generatedTitle) {
      responseHeaders["X-Generated-Title"] = generatedTitle;
    }
    if (currentConversationId) {
      responseHeaders["X-Conversation-Id"] = currentConversationId;
    }

    return result.toDataStreamResponse({
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
