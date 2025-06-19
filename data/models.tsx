"use server";
import { prisma } from "@/prisma";
import { PreferredModel } from "@prisma/client";
import { JsonValue } from "@prisma/client/runtime/library";
import { checkUser } from "@/lib/auth/check";
import { UnifiedModel } from "@/types/models";
import {
  GetModelsByProviderSchema,
  GetModelByIdSchema,
  SearchModelsSchema,
  AddPreferredModelSchema,
  RemovePreferredModelSchema,
} from "@/schemas/models";

// Simple in-memory cache for models (models don't change frequently)
let modelsCache: { data: UnifiedModel[]; timestamp: number } | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Union type for all provider model types using Prisma generated types
type ProviderModel = {
  id: string;
  modelId: string;
  name: string;
  description?: string | null;
  contextLength?: number | null;
  pricing?: JsonValue | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  modelFamily?: string;
  maxOutput?: number | null;
  capabilities?: JsonValue | null;
  provider?: string; // Only for OpenRouter models
};

// Helper function to normalize any model to UnifiedModel format
async function normalizeModel(
  model: ProviderModel,
  provider: string,
  direct: boolean = true
): Promise<UnifiedModel> {
  return {
    id: model.id,
    modelId: model.modelId,
    name: model.name,
    provider: provider,
    description: model.description,
    contextLength: model.contextLength,
    pricing: model.pricing,
    isActive: model.isActive,
    createdAt: model.createdAt,
    updatedAt: model.updatedAt,
    ...(model.modelFamily && { modelFamily: model.modelFamily }),
    ...(model.maxOutput && { maxOutput: model.maxOutput }),
    ...(model.capabilities && { capabilities: model.capabilities }),
    direct,
  };
}

export async function getAvailableModels(): Promise<UnifiedModel[]> {
  try {
    // Check cache first
    if (modelsCache && Date.now() - modelsCache.timestamp < CACHE_DURATION) {
      return modelsCache.data;
    }

    // Define exclusion filters for unwanted model types
    const exclusionFilters = {
      NOT: {
        OR: [
          { name: { contains: "embed" } },
          { name: { contains: "tts" } },
          { name: { contains: "image" } },
        ],
      },
    };

    // Fetch models from all provider tables in parallel with database-level filtering
    const [
      openRouterModels,
      anthropicModels,
      openaiModels,
      googleModels,
      deepseekModels,
      xaiModels,
    ] = await Promise.all([
      prisma.openRouterModel.findMany({
        where: {
          isActive: true,
          ...exclusionFilters,
        },
        orderBy: [{ provider: "asc" }, { name: "asc" }],
      }),
      prisma.anthropicModel.findMany({
        where: {
          isActive: true,
          ...exclusionFilters,
        },
        orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
      }),
      prisma.openaiModel.findMany({
        where: {
          isActive: true,
          ...exclusionFilters,
        },
        orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
      }),
      prisma.googleModel.findMany({
        where: {
          isActive: true,
          ...exclusionFilters,
        },
        orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
      }),
      prisma.deepSeekModel.findMany({
        where: {
          isActive: true,
          ...exclusionFilters,
        },
        orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
      }),
      prisma.xaiModel.findMany({
        where: {
          isActive: true,
          ...exclusionFilters,
        },
        orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
      }),
    ]);

    // Efficiently normalize and combine all models using the helper function
    const allModels: UnifiedModel[] = await Promise.all([
      ...openRouterModels.map((model) =>
        normalizeModel(model, "openrouter", false)
      ),
      ...anthropicModels.map((model) =>
        normalizeModel(model, "anthropic", true)
      ),
      ...openaiModels.map((model) => normalizeModel(model, "openai", true)),
      ...googleModels.map((model) => normalizeModel(model, "google", true)),
      ...deepseekModels.map((model) => normalizeModel(model, "deepseek", true)),
      ...xaiModels.map((model) => normalizeModel(model, "xai", true)),
    ]);

    // Final sort by provider then name (most data should already be sorted from DB)
    allModels.sort((a, b) => {
      if (a.provider !== b.provider) {
        return a.provider.localeCompare(b.provider);
      }
      return a.name.localeCompare(b.name);
    });

    // Cache the results
    modelsCache = {
      data: allModels,
      timestamp: Date.now(),
    };

    return allModels;
  } catch (error) {
    console.error("Error getting available models:", error);
    return [];
  }
}

// Helper function to clear models cache (useful for testing or when models are updated)
export async function clearModelsCache() {
  modelsCache = null;
}

export async function getPreferredModels(): Promise<PreferredModel[]> {
  try {
    const { userId } = await checkUser();
    if (!userId) {
      return [];
    }
    const usersPreferredModels = await prisma.preferredModel.findMany({
      where: { userId: userId },
    });
    return usersPreferredModels;
  } catch (error) {
    console.error("Error getting preferred models:", error);
    return [];
  }
}

export async function getModelsByProvider(
  provider: string
): Promise<UnifiedModel[]> {
  try {
    // Validate and sanitize input data
    const validatedData = GetModelsByProviderSchema.parse({ provider });

    // Define exclusion filters for unwanted model types
    const exclusionFilters = {
      NOT: {
        OR: [
          { name: { contains: "embed" } },
          { name: { contains: "tts" } },
          { name: { contains: "image" } },
        ],
      },
    };

    let models: UnifiedModel[] = [];

    // Query the specific provider's table directly
    switch (validatedData.provider) {
      case "openrouter":
        const openRouterModels = await prisma.openRouterModel.findMany({
          where: {
            isActive: true,
            ...exclusionFilters,
          },
          orderBy: [{ provider: "asc" }, { name: "asc" }],
        });
        models = await Promise.all(
          openRouterModels.map((model) =>
            normalizeModel(model, "openrouter", false)
          )
        );
        break;

      case "anthropic":
        const anthropicModels = await prisma.anthropicModel.findMany({
          where: {
            isActive: true,
            ...exclusionFilters,
          },
          orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
        });
        models = await Promise.all(
          anthropicModels.map((model) =>
            normalizeModel(model, "anthropic", true)
          )
        );
        break;

      case "openai":
        const openaiModels = await prisma.openaiModel.findMany({
          where: {
            isActive: true,
            ...exclusionFilters,
          },
          orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
        });
        models = await Promise.all(
          openaiModels.map((model) => normalizeModel(model, "openai", true))
        );
        break;

      case "google":
        const googleModels = await prisma.googleModel.findMany({
          where: {
            isActive: true,
            ...exclusionFilters,
          },
          orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
        });
        models = await Promise.all(
          googleModels.map((model) => normalizeModel(model, "google", true))
        );
        break;

      case "deepseek":
        const deepseekModels = await prisma.deepSeekModel.findMany({
          where: {
            isActive: true,
            ...exclusionFilters,
          },
          orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
        });
        models = await Promise.all(
          deepseekModels.map((model) => normalizeModel(model, "deepseek", true))
        );
        break;

      case "xai":
        const xaiModels = await prisma.xaiModel.findMany({
          where: {
            isActive: true,
            ...exclusionFilters,
          },
          orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
        });
        models = await Promise.all(
          xaiModels.map((model) => normalizeModel(model, "xai", true))
        );
        break;

      default:
        // For unknown providers, return empty array
        return [];
    }

    return models;
  } catch (error) {
    console.error("Error getting models by provider:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to get models by provider");
  }
}

export async function getModelById(
  modelId: string
): Promise<UnifiedModel | null> {
  try {
    // Validate and sanitize input data
    const validatedData = GetModelByIdSchema.parse({ modelId });

    // Check all provider tables for the model
    const [
      openRouterModel,
      anthropicModel,
      openaiModel,
      googleModel,
      deepseekModel,
      xaiModel,
    ] = await Promise.all([
      prisma.openRouterModel.findUnique({
        where: { modelId: validatedData.modelId },
      }),
      prisma.anthropicModel.findUnique({
        where: { modelId: validatedData.modelId },
      }),
      prisma.openaiModel.findUnique({
        where: { modelId: validatedData.modelId },
      }),
      prisma.googleModel.findUnique({
        where: { modelId: validatedData.modelId },
      }),
      prisma.deepSeekModel.findUnique({
        where: { modelId: validatedData.modelId },
      }),
      prisma.xaiModel.findUnique({ where: { modelId: validatedData.modelId } }),
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
  } catch (error) {
    console.error("Error getting model by ID:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to get model by ID");
  }
}

export async function getProviders(): Promise<string[]> {
  try {
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
  } catch (error) {
    console.error("Error getting providers:", error);
    return [];
  }
}

export async function searchModels(query: string): Promise<UnifiedModel[]> {
  try {
    // Validate and sanitize input data
    const validatedData = SearchModelsSchema.parse({ query });

    const allModels = await getAvailableModels();

    const lowerQuery = validatedData.query.toLowerCase();
    return allModels.filter(
      (model) =>
        model.name.toLowerCase().includes(lowerQuery) ||
        model.modelId.toLowerCase().includes(lowerQuery) ||
        (model.description &&
          model.description.toLowerCase().includes(lowerQuery))
    );
  } catch (error) {
    console.error("Error searching models:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to search models");
  }
}

export const addPreferredModel = async (modelId: string, provider: string) => {
  try {
    // Validate and sanitize input data
    const validatedData = AddPreferredModelSchema.parse({ modelId, provider });

    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Check if model is already preferred
    const existingPreference = await prisma.preferredModel.findFirst({
      where: {
        userId,
        model: validatedData.modelId,
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
        model: validatedData.modelId,
        provider: validatedData.provider,
      },
    });

    return preferredModel;
  } catch (error) {
    console.error("Error adding preferred model:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to add preferred model" };
  }
};

export const removePreferredModel = async (modelId: string) => {
  try {
    // Validate and sanitize input data
    const validatedData = RemovePreferredModelSchema.parse({ modelId });

    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    const preferredModel = await prisma.preferredModel.deleteMany({
      where: {
        userId,
        model: validatedData.modelId,
      },
    });

    return preferredModel;
  } catch (error) {
    console.error("Error removing preferred model:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to remove preferred model" };
  }
};

export const getUserPreferredModels = async () => {
  try {
    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

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
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to fetch preferred models" };
  }
};

export const getUserModels = async () => {
  "use server";
  try {
    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Get user's API keys to determine which providers they have access to
    const userApiKeys = await prisma.apiKey.findMany({
      where: {
        userId,
      },
      select: {
        provider: true,
      },
    });

    // Get unique providers the user has API keys for
    const userProviders = [...new Set(userApiKeys.map((key) => key.provider))];

    if (userProviders.length === 0) {
      return [];
    }

    // Define exclusion filters for unwanted model types
    const exclusionFilters = {
      NOT: {
        OR: [
          { name: { contains: "embed" } },
          { name: { contains: "tts" } },
          { name: { contains: "image" } },
        ],
      },
    };

    // Only fetch models from providers the user has API keys for
    const providerQueries = [];

    if (userProviders.includes("openrouter")) {
      providerQueries.push(
        prisma.openRouterModel
          .findMany({
            where: {
              isActive: true,
              ...exclusionFilters,
            },
            orderBy: [{ provider: "asc" }, { name: "asc" }],
          })
          .then((models) => ({ provider: "openrouter", models }))
      );
    }

    if (userProviders.includes("anthropic")) {
      providerQueries.push(
        prisma.anthropicModel
          .findMany({
            where: {
              isActive: true,
              ...exclusionFilters,
            },
            orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
          })
          .then((models) => ({ provider: "anthropic", models }))
      );
    }

    if (userProviders.includes("openai")) {
      providerQueries.push(
        prisma.openaiModel
          .findMany({
            where: {
              isActive: true,
              ...exclusionFilters,
            },
            orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
          })
          .then((models) => ({ provider: "openai", models }))
      );
    }

    if (userProviders.includes("google")) {
      providerQueries.push(
        prisma.googleModel
          .findMany({
            where: {
              isActive: true,
              ...exclusionFilters,
            },
            orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
          })
          .then((models) => ({ provider: "google", models }))
      );
    }

    if (userProviders.includes("deepseek")) {
      providerQueries.push(
        prisma.deepSeekModel
          .findMany({
            where: {
              isActive: true,
              ...exclusionFilters,
            },
            orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
          })
          .then((models) => ({ provider: "deepseek", models }))
      );
    }

    if (userProviders.includes("xai")) {
      providerQueries.push(
        prisma.xaiModel
          .findMany({
            where: {
              isActive: true,
              ...exclusionFilters,
            },
            orderBy: [{ modelFamily: "asc" }, { name: "asc" }],
          })
          .then((models) => ({ provider: "xai", models }))
      );
    }

    // Execute all provider queries in parallel
    const providerResults = await Promise.all(providerQueries);

    // Transform and normalize the results
    const userModels = providerResults.map(({ provider, models }) => {
      const normalizedModels = models.map((model) =>
        normalizeModel(model, provider, provider !== "openrouter")
      );

      return {
        id: provider,
        provider: provider,
        models: normalizedModels,
      };
    });

    return userModels;
  } catch (error) {
    console.error("Error fetching user models:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to fetch user models" };
  }
};
