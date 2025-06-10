import { createOpenAI } from "@ai-sdk/openai";
import { streamText, wrapLanguageModel } from "ai";
import { auth } from "@/auth";
import { getAPIKeys } from "@/data/apikeys";
import { createCacheMiddleware } from "@/lib/middleware/cache";

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const session = await auth();
  console.log("session", session);
  console.log("user", session?.user);
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
      // Optimize for faster streaming
      temperature: 0.7,
      maxTokens: 4000,
    });

    return result.toDataStreamResponse({
      // Add headers for better streaming performance
      headers: {
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        // Add cache info header for client-side monitoring
        "X-Cache-Optimized": "true",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
