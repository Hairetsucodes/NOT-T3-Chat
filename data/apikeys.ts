"use server";
import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";
import { z } from "zod";
import { populateOpenRouterModels } from "@/scripts/populate-openrouter-models";
import { populateAnthropicModels } from "@/scripts/populate-anthropic-models";
import { populateOpenAIModels } from "@/scripts/populate-openai-models";
import { populateGoogleModels } from "@/scripts/populate-google-models";
import { populateDeepSeekModels } from "@/scripts/populate-deepseek-models";
import { populateXaiModels } from "@/scripts/populate-xai-models";

// Input validation schemas
const providerSchema = z
  .enum([
    "openai",
    "anthropic",
    "google",
    "deepseek",
    "xai",
    "custom",
    "openrouter",
  ])
  .or(z.string().min(1).max(100));
const apiKeySchema = z.string().min(1).max(500).trim();

export const createAPIKey = async (key: string, provider: string) => {
  try {
    // Validate inputs
    const validatedKey = apiKeySchema.parse(key);
    const validatedProvider = providerSchema.parse(provider);
    if (validatedProvider.toLowerCase() === "openrouter") {
      await populateOpenRouterModels();
    }
    if (validatedProvider.toLowerCase() === "anthropic") {
      await populateAnthropicModels(validatedKey);
    }
    if (validatedProvider.toLowerCase() === "openai") {
      await populateOpenAIModels(validatedKey);
    }
    if (validatedProvider.toLowerCase() === "google") {
      await populateGoogleModels(validatedKey);
    }
    if (validatedProvider.toLowerCase() === "deepseek") {
      await populateDeepSeekModels(validatedKey);
    }
    if (validatedProvider.toLowerCase() === "xai") {
      await populateXaiModels(validatedKey);
    }
    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existingKey = await prisma.apiKey.findFirst({
      where: {
        userId: userId,
        provider: validatedProvider,
      },
    });

    if (existingKey) {
      const apiKey = await prisma.apiKey.update({
        where: {
          id: existingKey.id,
        },
        data: {
          key: validatedKey,
          provider: validatedProvider,
        },
      });
      return apiKey;
    }

    const apiKey = await prisma.apiKey.create({
      data: {
        key: validatedKey,
        provider: validatedProvider,
        userId: userId,
      },
    });
    return apiKey;
  } catch (error) {
    console.error("Error creating API key:", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid input data");
    }
    throw new Error("Failed to create API key");
  }
};

export const deleteAPIKey = async (keyId: string) => {
  try {
    const validatedKeyId = z.string().cuid().parse(keyId);

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    // CRITICAL: Verify the API key belongs to the authenticated user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: validatedKeyId,
        userId: userId, // This ensures only the owner can delete
      },
    });

    if (!apiKey) {
      throw new Error("API key not found or unauthorized");
    }

    await prisma.apiKey.delete({
      where: {
        id: validatedKeyId,
      },
    });
  } catch (error) {
    console.error("Error deleting API key:", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid input data");
    }
    throw new Error("Failed to delete API key");
  }
};

export const getProviders = async () => {
  const { userId } = await checkUser();
  if (!userId) {
    return [];
  }
  const providers = await prisma.apiKey.findMany({
    where: {
      userId: userId,
    },
    select: {
      id: true,
      provider: true,
    },
  });
  return providers;
};
