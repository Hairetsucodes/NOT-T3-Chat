"use server";
import { prisma } from "@/prisma";
import { PreferredModel } from "@prisma/client";
import { checkUser } from "@/lib/auth/check";
import { UnifiedModel } from "@/types/models";

export async function getAvailableModels(): Promise<UnifiedModel[]> {
  // Fetch models from all provider tables in parallel
  const [
    openRouterModels,
    anthropicModels,
    openaiModels,
    googleModels,
    deepseekModels,
    xaiModels,
  ] = await Promise.all([
    prisma.openRouterModel.findMany({
      where: { isActive: true },
      orderBy: [{ provider: "asc" }, { name: "asc" }],
    }),
    prisma.anthropicModel.findMany({
      where: { isActive: true },
      orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
    }),
    prisma.openaiModel.findMany({
      where: { isActive: true },
      orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
    }),
    prisma.googleModel.findMany({
      where: { isActive: true },
      orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
    }),
    prisma.deepSeekModel.findMany({
      where: { isActive: true },
      orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
    }),
    prisma.xaiModel.findMany({
      where: { isActive: true },
      orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
    }),
  ]);

  // Normalize OpenRouter models
  const normalizedOpenRouter: UnifiedModel[] = openRouterModels.map(
    (model) => ({
      id: model.id,
      modelId: model.modelId,
      name: model.name,
      provider: "openrouter",
      description: model.description,
      contextLength: model.contextLength,
      pricing: model.pricing,
      isActive: model.isActive,
      createdAt: model.createdAt,
      updatedAt: model.updatedAt,
      direct: false,
    })
  );

  // Normalize Anthropic models
  const normalizedAnthropic: UnifiedModel[] = anthropicModels.map((model) => ({
    id: model.id,
    modelId: model.modelId,
    name: model.name,
    provider: "anthropic",
    description: model.description,
    contextLength: model.contextLength,
    pricing: model.pricing,
    isActive: model.isActive,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    modelFamily: model.modelFamily,
    maxOutput: model.maxOutput,
    capabilities: model.capabilities,
    direct: true,
  }));

  // Normalize OpenAI models
  const normalizedOpenAI: UnifiedModel[] = openaiModels.map((model) => ({
    id: model.id,
    modelId: model.modelId,
    name: model.name,
    provider: "openai",
    description: model.description,
    contextLength: model.contextLength,
    pricing: model.pricing,
    isActive: model.isActive,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    modelFamily: model.modelFamily,
    maxOutput: model.maxOutput,
    capabilities: model.capabilities,
    direct: true,
  }));

  // Normalize Google models
  const normalizedGoogle: UnifiedModel[] = googleModels.map((model) => ({
    id: model.id,
    modelId: model.modelId,
    name: model.name,
    provider: "google",
    description: model.description,
    contextLength: model.contextLength,
    pricing: model.pricing,
    isActive: model.isActive,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    modelFamily: model.modelFamily,
    maxOutput: model.maxOutput,
    capabilities: model.capabilities,
    direct: true,
  }));

  // Normalize DeepSeek models
  const normalizedDeepSeek: UnifiedModel[] = deepseekModels.map((model) => ({
    id: model.id,
    modelId: model.modelId,
    name: model.name,
    provider: "deepseek",
    description: model.description,
    contextLength: model.contextLength,
    pricing: model.pricing,
    isActive: model.isActive,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    modelFamily: model.modelFamily,
    maxOutput: model.maxOutput,
    capabilities: model.capabilities,
    direct: true,
  }));

  // Normalize xAI models
  const normalizedXai: UnifiedModel[] = xaiModels.map((model) => ({
    id: model.id,
    modelId: model.modelId,
    name: model.name,
    provider: "xai",
    description: model.description,
    contextLength: model.contextLength,
    pricing: model.pricing,
    isActive: model.isActive,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    modelFamily: model.modelFamily,
    maxOutput: model.maxOutput,
    capabilities: model.capabilities,
    direct: true,
  }));

  // Combine all models, filter out embedding, TTS, and image models, and sort by provider then name
  const allModels = [
    ...normalizedOpenRouter,
    ...normalizedAnthropic,
    ...normalizedOpenAI,
    ...normalizedGoogle,
    ...normalizedDeepSeek,
    ...normalizedXai,
  ]
    .filter((model) => {
      const name = model.name.toLowerCase();
      return !name.includes("embed") && 
             !name.includes("tts") && 
             !name.includes("image");
    })
    .sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return a.name.localeCompare(b.name);
    });

  return allModels;
}

export async function getPreferredModels(): Promise<PreferredModel[]> {
  const { userId } = await checkUser();
  if (!userId) {
    return [];
  }
  const usersPreferredModels = await prisma.preferredModel.findMany({
    where: { userId: userId },
  });
  return usersPreferredModels;
}

export async function getModelsByProvider(
  provider: string
): Promise<UnifiedModel[]> {
  const allModels = await getAvailableModels();
  return allModels.filter((model) => model.provider === provider);
}

export async function getModelById(
  modelId: string
): Promise<UnifiedModel | null> {
  // Check all provider tables for the model
  const [
    openRouterModel,
    anthropicModel,
    openaiModel,
    googleModel,
    deepseekModel,
    xaiModel,
  ] = await Promise.all([
    prisma.openRouterModel.findUnique({ where: { modelId } }),
    prisma.anthropicModel.findUnique({ where: { modelId } }),
    prisma.openaiModel.findUnique({ where: { modelId } }),
    prisma.googleModel.findUnique({ where: { modelId } }),
    prisma.deepSeekModel.findUnique({ where: { modelId } }),
    prisma.xaiModel.findUnique({ where: { modelId } }),
  ]);

  // Return the first found model, normalized
  if (openRouterModel) {
    return {
      id: openRouterModel.id,
      modelId: openRouterModel.modelId,
      name: openRouterModel.name,
      provider: openRouterModel.provider,
      description: openRouterModel.description,
      contextLength: openRouterModel.contextLength,
      pricing: openRouterModel.pricing,
      isActive: openRouterModel.isActive,
      createdAt: openRouterModel.createdAt,
      updatedAt: openRouterModel.updatedAt,
      direct: false,
    };
  }

  if (anthropicModel) {
    return {
      id: anthropicModel.id,
      modelId: anthropicModel.modelId,
      name: anthropicModel.name,
      provider: "anthropic",
      description: anthropicModel.description,
      contextLength: anthropicModel.contextLength,
      pricing: anthropicModel.pricing,
      isActive: anthropicModel.isActive,
      createdAt: anthropicModel.createdAt,
      updatedAt: anthropicModel.updatedAt,
      modelFamily: anthropicModel.modelFamily,
      maxOutput: anthropicModel.maxOutput,
      capabilities: anthropicModel.capabilities,
      direct: true,
    };
  }

  if (openaiModel) {
    return {
      id: openaiModel.id,
      modelId: openaiModel.modelId,
      name: openaiModel.name,
      provider: "openai",
      description: openaiModel.description,
      contextLength: openaiModel.contextLength,
      pricing: openaiModel.pricing,
      isActive: openaiModel.isActive,
      createdAt: openaiModel.createdAt,
      updatedAt: openaiModel.updatedAt,
      modelFamily: openaiModel.modelFamily,
      maxOutput: openaiModel.maxOutput,
      capabilities: openaiModel.capabilities,
      direct: true,
    };
  }

  if (googleModel) {
    return {
      id: googleModel.id,
      modelId: googleModel.modelId,
      name: googleModel.name,
      provider: "google",
      description: googleModel.description,
      contextLength: googleModel.contextLength,
      pricing: googleModel.pricing,
      isActive: googleModel.isActive,
      createdAt: googleModel.createdAt,
      updatedAt: googleModel.updatedAt,
      modelFamily: googleModel.modelFamily,
      maxOutput: googleModel.maxOutput,
      capabilities: googleModel.capabilities,
      direct: true,
    };
  }

  if (deepseekModel) {
    return {
      id: deepseekModel.id,
      modelId: deepseekModel.modelId,
      name: deepseekModel.name,
      provider: "deepseek",
      description: deepseekModel.description,
      contextLength: deepseekModel.contextLength,
      pricing: deepseekModel.pricing,
      isActive: deepseekModel.isActive,
      createdAt: deepseekModel.createdAt,
      updatedAt: deepseekModel.updatedAt,
      modelFamily: deepseekModel.modelFamily,
      maxOutput: deepseekModel.maxOutput,
      capabilities: deepseekModel.capabilities,
      direct: true,
    };
  }

  if (xaiModel) {
    return {
      id: xaiModel.id,
      modelId: xaiModel.modelId,
      name: xaiModel.name,
      provider: "xai",
      description: xaiModel.description,
      contextLength: xaiModel.contextLength,
      pricing: xaiModel.pricing,
      isActive: xaiModel.isActive,
      createdAt: xaiModel.createdAt,
      updatedAt: xaiModel.updatedAt,
      modelFamily: xaiModel.modelFamily,
      maxOutput: xaiModel.maxOutput,
      capabilities: xaiModel.capabilities,
      direct: true,
    };
  }

  return null;
}

export async function getProviders(): Promise<string[]> {
  // Get providers from all model tables
  const [
    openRouterProviders,
    anthropicModels,
    openaiModels,
    googleModels,
    deepseekModels,
    xaiModels,
  ] = await Promise.all([
    prisma.openRouterModel.findMany({
      where: { isActive: true },
      select: { provider: true },
      distinct: ["provider"],
    }),
    prisma.anthropicModel.findMany({
      where: { isActive: true },
      select: { id: true }, // Just need to check if any exist
      take: 1,
    }),
    prisma.openaiModel.findMany({
      where: { isActive: true },
      select: { id: true },
      take: 1,
    }),
    prisma.googleModel.findMany({
      where: { isActive: true },
      select: { id: true },
      take: 1,
    }),
    prisma.deepSeekModel.findMany({
      where: { isActive: true },
      select: { id: true },
      take: 1,
    }),
    prisma.xaiModel.findMany({
      where: { isActive: true },
      select: { id: true },
      take: 1,
    }),
  ]);

  const providers = new Set<string>();

  // Add OpenRouter providers
  openRouterProviders.forEach((p) => providers.add(p.provider));

  // Add other providers if they have active models
  if (anthropicModels.length > 0) providers.add("anthropic");
  if (openaiModels.length > 0) providers.add("openai");
  if (googleModels.length > 0) providers.add("google");
  if (deepseekModels.length > 0) providers.add("deepseek");
  if (xaiModels.length > 0) providers.add("xai");

  return Array.from(providers).sort();
}

export async function searchModels(query: string): Promise<UnifiedModel[]> {
  const allModels = await getAvailableModels();

  const lowerQuery = query.toLowerCase();
  return allModels.filter(
    (model) =>
      model.name.toLowerCase().includes(lowerQuery) ||
      model.modelId.toLowerCase().includes(lowerQuery) ||
      (model.description &&
        model.description.toLowerCase().includes(lowerQuery))
  );
}

export const addPreferredModel = async (modelId: string, provider: string) => {
  const { userId } = await checkUser();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if model is already preferred
    const existingPreference = await prisma.preferredModel.findFirst({
      where: {
        userId,
        model: modelId,
      },
    });

    if (existingPreference) {
      return { error: "Model already in preferences" };
    }

    // Check current count of preferred models
    const currentPreferences = await prisma.preferredModel.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" }, // Order by oldest first
    });

    // If user already has 15 preferred models, remove the oldest one
    if (currentPreferences.length >= 15) {
      const oldestPreference = currentPreferences[0];
      await prisma.preferredModel.delete({
        where: { id: oldestPreference.id },
      });
    }

    const preferredModel = await prisma.preferredModel.create({
      data: {
        userId,
        model: modelId,
        provider,
      },
    });

    return preferredModel;
  } catch (error) {
    console.error("Error adding preferred model:", error);
    return { error: "Failed to add preferred model" };
  }
};

export const removePreferredModel = async (modelId: string) => {
  const { userId } = await checkUser();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  try {
    const preferredModel = await prisma.preferredModel.deleteMany({
      where: {
        userId,
        model: modelId,
      },
    });

    return preferredModel;
  } catch (error) {
    console.error("Error removing preferred model:", error);
    return { error: "Failed to remove preferred model" };
  }
};

export const getUserPreferredModels = async () => {
  const { userId } = await checkUser();
  if (!userId) {
    return { error: "Unauthorized" };
  }

  try {
    const preferredModels = await prisma.preferredModel.findMany({
      where: { userId },
      select: {
        id: true,
        model: true,
        provider: true,
        createdAt: true,
      },
      take: 15,
      orderBy: {
        createdAt: "desc",
      },
    });

    return preferredModels;
  } catch (error) {
    console.error("Error fetching preferred models:", error);
    return { error: "Failed to fetch preferred models" };
  }
};
