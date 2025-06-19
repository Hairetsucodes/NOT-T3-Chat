"use server";
import { decrypt } from "@/lib/encryption/encrypt";
import { generatePersonalizedPrompt } from "@/ai/utils/promptGeneration";
import { updateChatSettingsWithPrompt } from "@/ai/utils/promptGeneration";
import { checkUser } from "@/lib/auth/check";
import { GeneratePersonalizedPromptSchema } from "@/schemas/prompt";

export async function generateAndApplyPersonalizedPrompt(
  provider: string,
  modelId: string,
  apiKey: string
): Promise<string | null> {
  try {
    // Validate input data
    const validatedData = GeneratePersonalizedPromptSchema.parse({
      provider,
      modelId,
      apiKey,
    });

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("User not found");
    }
    
    // decrypt api key
    const decryptedApiKey = await decrypt(validatedData.apiKey);
    const promptId = await generatePersonalizedPrompt(
      userId,
      validatedData.provider,
      validatedData.modelId,
      decryptedApiKey
    );
    if (promptId) {
      const success = await updateChatSettingsWithPrompt(
        userId,
        promptId,
        validatedData.provider,
        validatedData.modelId
      );
      if (success) {
        return promptId;
      }
    }

    return null;
  } catch (error) {
    console.error("❌ Error in generateAndApplyPersonalizedPrompt:", error);
    return null;
  }
}
