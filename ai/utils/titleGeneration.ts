import { Message } from "@/types/chat";
import {
  getProviderConfig,
  getProviderName,
  callGoogleNonStreaming,
} from "../providers";
import { callProviderNonStreaming } from "./nonStream";

/**
 * Map any model to a simple, fast alternative for title generation
 */
function mapToTitleModel(modelId: string, provider: string): string {
  const actualProvider = modelId.includes("/") ? "openrouter" : provider;

  // For direct providers, always use the fastest/cheapest model
  switch (actualProvider.toLowerCase()) {
    case "openai":
      return "gpt-4o-mini";
    case "anthropic":
      return "claude-3-5-haiku-20241022";
    case "deepseek":
      return "deepseek-chat";
    case "xai":
      return "grok-3-fast";
    case "google":
      return "gemini-1.5-flash";
    default:
      return "openai/gpt-3.5-turbo-1106";
  }
}

/**
 * Generate a concise title for a conversation
 */
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
    // If model has a "/" in it, it's an OpenRouter model regardless of provider
    const actualProvider = modelId.includes("/") ? "openrouter" : provider;
    const titleModelId = mapToTitleModel(modelId, actualProvider);

    let title: string;

    // Handle Google separately due to different SDK
    if (actualProvider.toLowerCase() === "google") {
      title = await callGoogleNonStreaming(titlePrompt, titleModelId, apiKey);
    } else {
      // Use generic provider non-streaming for all other providers
      const config = getProviderConfig(actualProvider);
      const providerName = getProviderName(actualProvider);

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
