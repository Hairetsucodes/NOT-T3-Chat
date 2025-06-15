import { prisma } from "@/prisma";

interface AnthropicModel {
  id: string;
  display_name: string;
  created_at: string;
  type: string;
}

interface AnthropicResponse {
  data: AnthropicModel[];
  first_id?: string;
  has_more: boolean;
  last_id?: string;
}

// Enhanced model data based on Anthropic documentation
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
  "claude-opus-4-20250514": {
    description:
      "Our most capable and intelligent model yet. Claude Opus 4 sets new standards in complex reasoning and advanced coding",
    contextLength: 200000,
    maxOutput: 32000,
    pricing: {
      prompt: "0.015",
      completion: "0.075",
    },
    capabilities: ["text", "vision", "extended_thinking"],
  },
  "claude-sonnet-4-20250514": {
    description:
      "Our high-performance model with exceptional reasoning and efficiency",
    contextLength: 200000,
    maxOutput: 64000,
    pricing: {
      prompt: "0.003",
      completion: "0.015",
    },
    capabilities: ["text", "vision", "extended_thinking"],
  },
  "claude-3-7-sonnet-20250219": {
    description:
      "High-performance model with early extended thinking capabilities",
    contextLength: 200000,
    maxOutput: 64000,
    pricing: {
      prompt: "0.003",
      completion: "0.015",
    },
    capabilities: ["text", "vision", "extended_thinking"],
  },
  "claude-3-5-sonnet-20241022": {
    description:
      "Our previous intelligent model with high level of intelligence and capability",
    contextLength: 200000,
    maxOutput: 8192,
    pricing: {
      prompt: "0.003",
      completion: "0.015",
    },
    capabilities: ["text", "vision"],
  },
  "claude-3-5-sonnet-20240620": {
    description: "Previous version of Claude 3.5 Sonnet",
    contextLength: 200000,
    maxOutput: 8192,
    pricing: {
      prompt: "0.003",
      completion: "0.015",
    },
    capabilities: ["text", "vision"],
  },
  "claude-3-5-haiku-20241022": {
    description: "Our fastest model with intelligence at blazing speeds",
    contextLength: 200000,
    maxOutput: 8192,
    pricing: {
      prompt: "0.0008",
      completion: "0.004",
    },
    capabilities: ["text", "vision"],
  },
  "claude-3-opus-20240229": {
    description:
      "Powerful model for complex tasks with top-level intelligence, fluency, and understanding",
    contextLength: 200000,
    maxOutput: 4096,
    pricing: {
      prompt: "0.015",
      completion: "0.075",
    },
    capabilities: ["text", "vision"],
  },
  "claude-3-sonnet-20240229": {
    description: "Balanced model for a wide range of tasks",
    contextLength: 200000,
    maxOutput: 4096,
    pricing: {
      prompt: "0.003",
      completion: "0.015",
    },
    capabilities: ["text", "vision"],
  },
  "claude-3-haiku-20240307": {
    description: "Fast and compact model for near-instant responsiveness",
    contextLength: 200000,
    maxOutput: 4096,
    pricing: {
      prompt: "0.00025",
      completion: "0.00125",
    },
    capabilities: ["text", "vision"],
  },
};

async function fetchAnthropicModels(apiKey: string): Promise<AnthropicModel[]> {
  try {
    const allModels: AnthropicModel[] = [];
    let hasMore = true;
    let afterId: string | undefined;

    while (hasMore) {
      const url = new URL("https://api.anthropic.com/v1/models");
      if (afterId) {
        url.searchParams.set("after_id", afterId);
      }
      url.searchParams.set("limit", "100");

      const response = await fetch(url.toString(), {
        headers: {
          "x-api-key": apiKey,
          "anthropic-version": "2023-06-01",
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AnthropicResponse = await response.json();
      allModels.push(...data.data);

      hasMore = data.has_more;
      afterId = data.last_id || undefined;
    }

    return allModels;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

function extractModelFamily(modelId: string): string {
  // Extract model family from model ID (e.g., "claude-3-5-sonnet-20241022" -> "claude-3-5-sonnet")
  const parts = modelId.split("-");
  if (parts.length >= 4) {
    return parts.slice(0, -1).join("-");
  }
  return modelId;
}

export async function populateAnthropicModels(apiKey: string) {
  try {
    const existingModels = await prisma.anthropicModel.findMany();
    if (existingModels.length > 0) {
      return;
    }

    const models = await fetchAnthropicModels(apiKey);

    // Insert models in batches to avoid overwhelming the database
    const batchSize = 50;

    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map((model) => {
          const modelFamily = extractModelFamily(model.id);
          const enhancement = MODEL_ENHANCEMENTS[model.id];

          return prisma.anthropicModel.create({
            data: {
              modelId: model.id,
              name: model.display_name,
              modelFamily: modelFamily,
              description: enhancement?.description || null,
              contextLength: enhancement?.contextLength || null,
              maxOutput: enhancement?.maxOutput || null,
              pricing: enhancement?.pricing || undefined,
              capabilities: enhancement?.capabilities || undefined,
              createdAt: new Date(model.created_at),
              isActive: true,
            },
          });
        })
      );
    }

    // Show capability stats
    const allModels = await prisma.anthropicModel.findMany();
    const capabilityStats: Record<string, number> = {};

    allModels.forEach((model) => {
      if (model.capabilities && Array.isArray(model.capabilities)) {
        (model.capabilities as string[]).forEach((capability) => {
          capabilityStats[capability] = (capabilityStats[capability] || 0) + 1;
        });
      }
    });
  } catch (error) {
    console.error("Error populating Anthropic models:", error);
  } finally {
    await prisma.$disconnect();
  }
}
