import { Message } from "@/types/chat";
import { getProviderConfig, getProviderName, callGoogleNonStreaming } from '../providers';
import { callProviderNonStreaming } from './streaming';

/**
 * Map complex reasoning models to simpler alternatives for title generation
 */
function mapToTitleModel(modelId: string, provider: string): string {
  const actualProvider = modelId.includes("/") ? "openrouter" : provider;

  if (actualProvider === "openrouter") {
    // Map OpenRouter reasoning models to simpler alternatives
    if (
      modelId.includes("o1") ||
      modelId.includes("o4") ||
      modelId.includes("reasoning") ||
      modelId.includes("qwq")
    ) {
      return "openai/gpt-4o-mini"; // Fast, reliable OpenAI model via OpenRouter
    } else if (modelId.includes("claude") && modelId.includes("3.5")) {
      return "anthropic/claude-3-5-haiku-20241022"; // Fast Claude model
    } else if (modelId.includes("deepseek") && modelId.includes("reasoner")) {
      return "deepseek/deepseek-chat"; // Simpler DeepSeek model
    }
  } else {
    // Map direct provider reasoning models to simpler alternatives
    switch (actualProvider.toLowerCase()) {
      case "openai":
        if (modelId.includes("o1")) {
          return "gpt-4o-mini";
        }
        break;
      case "anthropic":
        if (modelId.includes("opus")) {
          return "claude-3-5-haiku-20241022";
        }
        break;
      case "deepseek":
        if (modelId.includes("reasoner")) {
          return "deepseek-chat";
        }
        break;
    }
  }

  return modelId; // Return original if no mapping needed
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