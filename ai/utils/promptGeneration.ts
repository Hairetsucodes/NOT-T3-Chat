import { Message } from "@/types/chat";
import {
  getProviderConfig,
  getProviderName,
  callGoogleNonStreaming,
} from "../providers";
import { callProviderNonStreaming } from "./nonStream";
import { prisma } from "@/prisma";

/**
 * Map complex reasoning models to simpler alternatives for prompt generation
 */
function mapToPromptModel(modelId: string, provider: string): string {
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
      case "google":
        // Map premium/experimental Google models to free alternatives
        if (
          modelId.includes("2.5") ||
          modelId.includes("preview") ||
          modelId.includes("exp")
        ) {
          return "gemini-1.5-flash"; // Fast, free Google model
        } else if (modelId.includes("pro") && !modelId.includes("1.0")) {
          return "gemini-1.0-pro"; // Free pro model
        }
        break;
    }
  }

  return modelId; // Return original if no mapping needed
}

/**
 * Generate a personalized system prompt based on user customization
 */
export async function generatePersonalizedPrompt(
  userId: string,
  provider: string,
  modelId: string,
  apiKey: string
): Promise<string | null> {
  try {
    // Get user customization data
    const userCustomization = await prisma.userCustomization.findUnique({
      where: { userId },
    });

    if (!userCustomization) {
      console.warn("No user customization found for user:", userId);
      return null;
    }

    const { displayName, userRole, userTraits, additionalContext } =
      userCustomization;

    // Build the prompt generation request
    const promptGenerationMessages: Message[] = [
      {
        role: "system",
        content: `You are an expert AI assistant prompt engineer. Generate a personalized system prompt for an AI assistant based on the user's customization preferences. 

The system prompt should:
1. Be professional and clear
2. Incorporate the user's display name, role, traits, and additional context naturally
3. Set appropriate expectations for the AI's behavior and responses
4. Be concise but comprehensive (aim for 2-4 sentences)
5. Return ONLY the system prompt text, no additional commentary

Create a system prompt that makes the AI assistant tailored to this specific user.`,
        timestamp: new Date(),
      },
      {
        role: "user",
        content: `Generate a personalized system prompt using this user information:
${displayName ? `Display Name: ${displayName}` : ""}
${userRole ? `Role: ${userRole}` : ""}
${userTraits ? `User Traits: ${userTraits}` : ""}
${additionalContext ? `Additional Context: ${additionalContext}` : ""}

Please create a system prompt that incorporates this information to personalize the AI assistant's responses.`,
        timestamp: new Date(),
      },
    ];

    // If model has a "/" in it, it's an OpenRouter model regardless of provider
    const actualProvider = modelId.includes("/") ? "openrouter" : provider;
    const promptModelId = mapToPromptModel(modelId, actualProvider);

    let generatedPrompt: string;

    // Handle Google separately due to different SDK
    if (actualProvider.toLowerCase() === "google") {
      generatedPrompt = await callGoogleNonStreaming(
        promptGenerationMessages,
        promptModelId,
        apiKey
      );
    } else {
      // Use generic provider non-streaming for all other providers
      const config = getProviderConfig(actualProvider);
      const providerName = getProviderName(actualProvider);

      generatedPrompt = await callProviderNonStreaming(
        promptGenerationMessages,
        promptModelId,
        apiKey,
        config,
        providerName
      );
    }

    // Clean up the generated prompt
    generatedPrompt = generatedPrompt.replace(/^["']|["']$/g, "").trim();

    if (!generatedPrompt) {
      throw new Error("Empty prompt generated");
    }

    // Save the generated prompt to the database
    const savedPrompt = await prisma.prompt.create({
      data: {
        userId,
        prompt: generatedPrompt,
      },
    });

    return savedPrompt.id;
  } catch {
    return null;
  }
}

/**
 * Update ChatSettings to use the generated prompt
 */
export async function updateChatSettingsWithPrompt(
  userId: string,
  promptId: string,
  provider: string,
  model: string
): Promise<boolean> {
  try {
    let existingSettings = null;

    // Try to find existing settings, but handle schema mismatch gracefully
    try {
      existingSettings = await prisma.chatSettings.findFirst({
        where: { userId, provider, model },
        select: {
          id: true,
          userId: true,
          provider: true,
          model: true,
          promptId: true,
        },
      });
    } catch (schemaError) {
      console.error("Schema mismatch when querying ChatSettings:", schemaError);
    }

    if (existingSettings) {
      // Update existing settings
      try {
        await prisma.chatSettings.update({
          where: { id: existingSettings.id },
          data: { promptId },
        });
      } catch (error) {
        console.error("Error updating ChatSettings:", error);
        // If update fails, try creating a new one
        await createNewChatSettings(userId, provider, model, promptId);
      }
    } else {
      // Create new settings
      await createNewChatSettings(userId, provider, model, promptId);
    }

    return true;
  } catch {
    return false;
  }
}

// Helper function to create new ChatSettings with minimal fields
async function createNewChatSettings(
  userId: string,
  provider: string,
  model: string,
  promptId: string
) {
  try {
    await prisma.chatSettings.create({
      data: {
        userId,
        provider,
        model,
        promptId,
      },
    });
  } catch (createError) {
    console.error("Error creating new ChatSettings:", createError);
    throw createError;
  }
}

/**
 * Generate and apply personalized prompt (combines both functions)
 */
export async function generateAndApplyPersonalizedPrompt(
  userId: string,
  provider: string,
  modelId: string,
  apiKey: string
): Promise<string | null> {
  try {
    const promptId = await generatePersonalizedPrompt(
      userId,
      provider,
      modelId,
      apiKey
    );

    if (promptId) {
      const success = await updateChatSettingsWithPrompt(
        userId,
        promptId,
        provider,
        modelId
      );
      if (success) {
        return promptId;
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Error in generateAndApplyPersonalizedPrompt:", error);
    return null;
  } finally {
    await prisma.$disconnect();
  }
}
