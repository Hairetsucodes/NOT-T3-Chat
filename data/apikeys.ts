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
const userIdSchema = z.string().cuid();

export const createAPIKey = async (
  userId: string,
  key: string,
  provider: string
) => {
  try {
    // Validate inputs
    const validatedUserId = userIdSchema.parse(userId);
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
    const user = await checkUser({ userId: validatedUserId });
    if (!user) {
      throw new Error("Unauthorized");
    }

    const existingKey = await prisma.apiKey.findFirst({
      where: {
        userId: validatedUserId,
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
        userId: validatedUserId,
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

export const getAPIKeys = async (userId: string) => {
  try {
    const validatedUserId = userIdSchema.parse(userId);

    const user = await checkUser({ userId: validatedUserId });
    if (!user) {
      throw new Error("Unauthorized");
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: validatedUserId,
      },
    });
    return apiKeys;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid user ID");
    }
    throw new Error("Failed to fetch API keys");
  }
};

export const deleteAPIKey = async (userId: string, keyId: string) => {
  try {
    const validatedUserId = userIdSchema.parse(userId);
    const validatedKeyId = z.string().cuid().parse(keyId);

    const user = await checkUser({ userId: validatedUserId });
    if (!user) {
      throw new Error("Unauthorized");
    }

    // CRITICAL: Verify the API key belongs to the authenticated user
    const apiKey = await prisma.apiKey.findFirst({
      where: {
        id: validatedKeyId,
        userId: validatedUserId, // This ensures only the owner can delete
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

export const getProviders = async (userId: string) => {
  const validatedUserId = userIdSchema.parse(userId);
  const user = await checkUser({ userId: validatedUserId });
  if (!user) {
    throw new Error("Unauthorized");
  }

  const providers = await prisma.apiKey.findMany({
    where: {
      userId: validatedUserId,
    },
    select: {
      id: true,
      provider: true,
    },
  });
  return providers;
};
