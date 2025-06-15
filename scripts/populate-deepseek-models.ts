import { prisma } from "@/prisma";

interface DeepSeekModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface DeepSeekResponse {
  object: string;
  data: DeepSeekModel[];
}

// Enhanced model data based on DeepSeek documentation
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
  "deepseek-chat": {
    description:
      "DeepSeek Chat is a general-purpose conversational AI model optimized for dialogue and instruction following.",
    contextLength: 32768,
    maxOutput: 4096,
    pricing: {
      prompt: "0.00014",
      completion: "0.00028",
    },
    capabilities: ["text", "function_calling"],
  },
  "deepseek-coder": {
    description:
      "DeepSeek Coder is specialized for code generation, code completion, and programming-related tasks.",
    contextLength: 16384,
    maxOutput: 4096,
    pricing: {
      prompt: "0.00014",
      completion: "0.00028",
    },
    capabilities: ["text", "code_generation", "function_calling"],
  },
  "deepseek-v3": {
    description:
      "DeepSeek V3 is the latest and most advanced model with improved reasoning and coding capabilities.",
    contextLength: 64000,
    maxOutput: 8192,
    pricing: {
      prompt: "0.00027",
      completion: "0.0011",
    },
    capabilities: ["text", "reasoning", "code_generation", "function_calling"],
  },
  "deepseek-r1": {
    description:
      "DeepSeek R1 is a reasoning model designed for complex problem-solving with step-by-step thinking.",
    contextLength: 64000,
    maxOutput: 8192,
    pricing: {
      prompt: "0.00055",
      completion: "0.0022",
    },
    capabilities: ["text", "reasoning", "step_by_step_thinking"],
  },
  "deepseek-r1-lite-preview": {
    description:
      "DeepSeek R1 Lite is a lighter version of the reasoning model, optimized for speed while maintaining reasoning capabilities.",
    contextLength: 32768,
    maxOutput: 4096,
    pricing: {
      prompt: "0.00014",
      completion: "0.00028",
    },
    capabilities: ["text", "reasoning"],
  },
  "deepseek-reasoner": {
    description:
      "DeepSeek Reasoner is specifically designed for complex reasoning tasks and multi-step problem solving.",
    contextLength: 32768,
    maxOutput: 4096,
    pricing: {
      prompt: "0.00055",
      completion: "0.0022",
    },
    capabilities: ["text", "reasoning", "problem_solving"],
  },
};

async function fetchDeepSeekModels(apiKey: string): Promise<DeepSeekModel[]> {
  try {
    const response = await fetch("https://api.deepseek.com/models", {
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: DeepSeekResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

function extractModelFamily(modelId: string): string {
  // Extract model family from model ID
  if (modelId.startsWith("deepseek-v3")) {
    return "deepseek-v3";
  } else if (modelId.startsWith("deepseek-r1-lite")) {
    return "deepseek-r1-lite";
  } else if (modelId.startsWith("deepseek-r1")) {
    return "deepseek-r1";
  } else if (modelId.startsWith("deepseek-coder")) {
    return "deepseek-coder";
  } else if (modelId.startsWith("deepseek-chat")) {
    return "deepseek-chat";
  } else if (modelId.startsWith("deepseek-reasoner")) {
    return "deepseek-reasoner";
  }

  // Default fallback
  const parts = modelId.split("-");
  if (parts.length >= 2) {
    return parts.slice(0, 2).join("-");
  }
  return modelId;
}

export async function populateDeepSeekModels(apiKey: string) {
  try {
    const existingModels = await prisma.deepSeekModel.findMany();
    if (existingModels.length > 0) {
      return;
    }

    const models = await fetchDeepSeekModels(apiKey);

    // Insert models in batches to avoid overwhelming the database
    const batchSize = 50;

    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map((model) => {
          const modelFamily = extractModelFamily(model.id);
          const enhancement =
            MODEL_ENHANCEMENTS[model.id] || MODEL_ENHANCEMENTS[modelFamily];

          return prisma.deepSeekModel.create({
            data: {
              modelId: model.id,
              name: model.id, // DeepSeek uses model ID as name
              modelFamily: modelFamily,
              description: enhancement?.description || null,
              contextLength: enhancement?.contextLength || null,
              maxOutput: enhancement?.maxOutput || null,
              pricing: enhancement?.pricing || undefined,
              capabilities: enhancement?.capabilities || undefined,
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
    const allModels = await prisma.deepSeekModel.findMany();
    const capabilityStats: Record<string, number> = {};

    allModels.forEach((model) => {
      if (model.capabilities && Array.isArray(model.capabilities)) {
        (model.capabilities as string[]).forEach((capability) => {
          capabilityStats[capability] = (capabilityStats[capability] || 0) + 1;
        });
      }
    });
  } catch (error) {
    console.error("Error populating DeepSeek models:", error);
  } finally {
    await prisma.$disconnect();
  }
}
