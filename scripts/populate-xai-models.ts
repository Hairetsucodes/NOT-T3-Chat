import { prisma } from "@/prisma";

interface XaiModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface XaiResponse {
  object: string;
  data: XaiModel[];
}

// Enhanced model data based on xAI documentation
const MODEL_ENHANCEMENTS: Record<
  string,
  {
    description?: string;
    contextLength?: number;
    pricing?: {
      prompt: string;
      completion: string;
      request?: string;
      image?: string;
    };
    maxOutput?: number;
    capabilities?: string[];
  }
> = {
  "grok-3": {
    description:
      "Grok-3 is xAI's most advanced model, offering state-of-the-art reasoning and conversational capabilities.",
    contextLength: 131072,
    maxOutput: 8192,
    pricing: {
      prompt: "0.01",
      completion: "0.04",
    },
    capabilities: ["text", "reasoning", "function_calling"],
  },
  "grok-3-fast": {
    description:
      "Grok-3 Fast is optimized for speed while maintaining high-quality responses for most tasks.",
    contextLength: 131072,
    maxOutput: 8192,
    pricing: {
      prompt: "0.005",
      completion: "0.02",
    },
    capabilities: ["text", "reasoning", "function_calling"],
  },
  "grok-3-mini": {
    description:
      "Grok-3 Mini is a compact, efficient model designed for lightweight tasks with fast response times.",
    contextLength: 32768,
    maxOutput: 4096,
    pricing: {
      prompt: "0.001",
      completion: "0.004",
    },
    capabilities: ["text", "function_calling"],
  },
  "grok-3-mini-fast": {
    description:
      "Grok-3 Mini Fast combines the efficiency of the mini model with optimized speed for rapid responses.",
    contextLength: 32768,
    maxOutput: 4096,
    pricing: {
      prompt: "0.0005",
      completion: "0.002",
    },
    capabilities: ["text", "function_calling"],
  },
  "grok-2-1212": {
    description:
      "Grok-2 is xAI's powerful large language model with advanced reasoning and conversational abilities.",
    contextLength: 131072,
    maxOutput: 8192,
    pricing: {
      prompt: "0.008",
      completion: "0.032",
    },
    capabilities: ["text", "reasoning", "function_calling"],
  },
  "grok-2-vision-1212": {
    description:
      "Grok-2 Vision combines the power of Grok-2 with advanced vision capabilities for multimodal understanding.",
    contextLength: 131072,
    maxOutput: 8192,
    pricing: {
      prompt: "0.008",
      completion: "0.032",
    },
    capabilities: ["text", "vision", "reasoning", "function_calling"],
  },
  "grok-2-image-1212": {
    description:
      "Grok-2 Image is specialized for image generation and visual content creation tasks.",
    contextLength: 4096,
    maxOutput: 1,
    pricing: {
      prompt: "0",
      completion: "0",
      image: "0.05",
    },
    capabilities: ["image_generation"],
  },
};

async function fetchXaiModels(apiKey: string): Promise<XaiModel[]> {
  try {
    const response = await fetch("https://api.x.ai/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: XaiResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

function extractModelFamily(modelId: string): string {
  // Extract model family from model ID
  if (modelId.startsWith("grok-3-mini-fast")) {
    return "grok-3-mini-fast";
  } else if (modelId.startsWith("grok-3-mini")) {
    return "grok-3-mini";
  } else if (modelId.startsWith("grok-3-fast")) {
    return "grok-3-fast";
  } else if (modelId.startsWith("grok-3")) {
    return "grok-3";
  } else if (modelId.startsWith("grok-2-vision")) {
    return "grok-2-vision";
  } else if (modelId.startsWith("grok-2-image")) {
    return "grok-2-image";
  } else if (modelId.startsWith("grok-2")) {
    return "grok-2";
  }

  // Default fallback
  const parts = modelId.split("-");
  if (parts.length >= 2) {
    return parts.slice(0, 2).join("-");
  }
  return modelId;
}

export async function populateXaiModels(apiKey: string) {
  try {
    const existingModels = await prisma.xaiModel.findMany();
    if (existingModels.length > 0) {
      return existingModels;
    }

    const models = await fetchXaiModels(apiKey);

    // Insert models in batches to avoid overwhelming the database
    const batchSize = 50;

    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map((model) => {
          const modelFamily = extractModelFamily(model.id);
          const enhancement =
            MODEL_ENHANCEMENTS[model.id] || MODEL_ENHANCEMENTS[modelFamily];

          return prisma.xaiModel.create({
            data: {
              modelId: model.id,
              name: model.id, // xAI uses model ID as name
              modelFamily: modelFamily,
              description: enhancement?.description || null,
              contextLength: enhancement?.contextLength || null,
              maxOutput: enhancement?.maxOutput || null,
              pricing: enhancement?.pricing
                ? JSON.stringify(enhancement.pricing)
                : undefined,
              capabilities: enhancement?.capabilities
                ? JSON.stringify(enhancement.capabilities)
                : undefined,
              createdAt:
                model.created && !isNaN(model.created)
                  ? new Date(model.created * 1000)
                  : new Date(), // Handle invalid timestamps
              isActive: true,
            },
          });
        })
      );
    }

    // Show capability stats
  } catch (error) {
    console.error("Error populating xAI models:", error);
  } finally {
    await prisma.$disconnect();
  }
}
