import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface OpenRouterModel {
  id: string;
  name: string;
  description?: string;
  context_length?: number;
  pricing?: {
    prompt?: string;
    completion?: string;
    request?: string;
    image?: string;
  };
  created?: number;
  architecture?: {
    modality?: string;
    tokenizer?: string;
  };
}

interface OpenRouterResponse {
  data: OpenRouterModel[];
}

async function fetchOpenRouterModels(): Promise<OpenRouterModel[]> {
  try {
    const response = await fetch("https://openrouter.ai/api/v1/models");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data: OpenRouterResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

function extractProvider(modelId: string): string {
  // Extract provider from model ID (e.g., "openai/gpt-4" -> "openai")
  const parts = modelId.split("/");
  return parts[0] || "unknown";
}

export async function populateOpenRouterModels() {
  try {
    const existingModels = await prisma.openRouterModel.findMany();
    if (existingModels.length > 0) {
      return existingModels;
    }

    const models = await fetchOpenRouterModels();

    // Insert models in batches to avoid overwhelming the database
    const batchSize = 50;

    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map((model) => {
          const provider = extractProvider(model.id);

          return prisma.openRouterModel.create({
            data: {
              modelId: model.id,
              name: model.name,
              provider: provider,
              description: model.description || null,
              contextLength: model.context_length || null,
              pricing: model.pricing
                ? JSON.stringify(model.pricing)
                : undefined,
              isActive: true,
            },
          });
        })
      );
    }
  } catch (error) {
    console.error("Error populating models:", error);
  } finally {
    await prisma.$disconnect();
  }
}
