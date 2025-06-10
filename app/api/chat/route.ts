import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";
import { auth } from "@/auth";
import { getAPIKeys } from "@/data/apikeys";

// Allow streaming responses up to 30 seconds
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();

  // Get the authenticated user from the JWT token
  const session = await auth();
  console.log("session", session);
  console.log("user", session?.user);
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    // Get the user's API keys from the database
    const apiKeys = await getAPIKeys(session.user.id);
    const openaiKey = apiKeys.find((key) => key.provider === "openai");

    if (!openaiKey) {
      return new Response(
        "OpenAI API key not found. Please add your OpenAI API key in settings.",
        { status: 400 }
      );
    }

    // Create OpenAI client with user's API key
    const openai = createOpenAI({
      apiKey: openaiKey.key,
    });

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
