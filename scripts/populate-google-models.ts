import { prisma } from "@/prisma";

interface GoogleModel {
  name: string;
  version: string;
  displayName: string;
  description: string;
  inputTokenLimit: number;
  outputTokenLimit: number;
  supportedGenerationMethods: string[];
  temperature?: number;
  topP?: number;
  topK?: number;
}

interface GoogleModelsResponse {
  models: GoogleModel[];
}

// Enhanced model data based on Google documentation
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
  "gemini-2.5-flash": {
    description:
      "Gemini 2.5 Flash is Google's state-of-the-art workhorse model, specifically designed for advanced reasoning, coding, mathematics, and scientific tasks.",
    contextLength: 1048576,
    maxOutput: 8192,
    pricing: {
      prompt: "0.00000015",
      completion: "0.0000006",
    },
    capabilities: ["text", "vision", "reasoning", "function_calling"],
  },
  "gemini-2.0-flash": {
    description:
      "Gemini Flash 2.0 offers significantly faster time to first token while maintaining quality on par with larger models.",
    contextLength: 1048576,
    maxOutput: 8192,
    pricing: {
      prompt: "0.0000001",
      completion: "0.0000004",
    },
    capabilities: ["text", "vision", "function_calling"],
  },
  "gemini-2.0-flash-lite": {
    description:
      "Gemini 2.0 Flash Lite offers extremely economical token prices while maintaining quality.",
    contextLength: 1048576,
    maxOutput: 8192,
    pricing: {
      prompt: "0.000000075",
      completion: "0.0000003",
    },
    capabilities: ["text", "vision"],
  },
  "gemini-1.5-pro": {
    description:
      "Gemini 1.5 Pro is our most capable model with a breakthrough long context window of up to 2 million tokens.",
    contextLength: 2097152,
    maxOutput: 8192,
    pricing: {
      prompt: "0.00000125",
      completion: "0.000005",
    },
    capabilities: ["text", "vision", "function_calling", "long_context"],
  },
  "gemini-1.5-flash": {
    description:
      "Gemini 1.5 Flash is designed for high-volume, high-frequency tasks where speed and efficiency are critical.",
    contextLength: 1048576,
    maxOutput: 8192,
    pricing: {
      prompt: "0.000000075",
      completion: "0.0000003",
    },
    capabilities: ["text", "vision", "function_calling"],
  },
  "gemini-1.0-pro": {
    description:
      "Gemini 1.0 Pro is our foundational large language model that's optimized for a wide range of tasks.",
    contextLength: 32768,
    maxOutput: 8192,
    pricing: {
      prompt: "0.0000005",
      completion: "0.0000015",
    },
    capabilities: ["text", "function_calling"],
  },
  "gemini-1.0-pro-vision": {
    description:
      "Gemini 1.0 Pro Vision can understand and reason about visual inputs including images.",
    contextLength: 16384,
    maxOutput: 2048,
    pricing: {
      prompt: "0.00000025",
      completion: "0.0000005",
    },
    capabilities: ["text", "vision"],
  },
  "text-embedding-004": {
    description:
      "Google's latest text embedding model for semantic search and similarity tasks.",
    contextLength: 2048,
    maxOutput: 768, // embedding dimensions
    pricing: {
      prompt: "0.00001", // per 1K characters
      completion: "0",
    },
    capabilities: ["embeddings"],
  },
  aqa: {
    description:
      "Attributed Question Answering model that provides answers with citations from provided sources.",
    contextLength: 32768,
    maxOutput: 2048,
    pricing: {
      prompt: "0.0000005",
      completion: "0.0000015",
    },
    capabilities: ["text", "question_answering", "citations"],
  },
};

async function fetchGoogleModels(apiKey: string): Promise<GoogleModel[]> {
  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GoogleModelsResponse = await response.json();
    return data.models || [];
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

function extractModelFamily(modelId: string): string {
  // Remove "models/" prefix if present
  const cleanId = modelId.replace(/^models\//, "");

  // Extract model family from model ID
  if (cleanId.startsWith("gemini-2.5")) {
    return "gemini-2.5";
  } else if (cleanId.startsWith("gemini-2.0")) {
    return "gemini-2.0";
  } else if (cleanId.startsWith("gemini-1.5")) {
    return "gemini-1.5";
  } else if (cleanId.startsWith("gemini-1.0")) {
    return "gemini-1.0";
  } else if (cleanId.startsWith("gemini-pro")) {
    return "gemini-pro";
  } else if (cleanId.startsWith("gemini-flash")) {
    return "gemini-flash";
  } else if (cleanId.startsWith("text-embedding")) {
    return "text-embedding";
  } else if (cleanId.startsWith("aqa")) {
    return "aqa";
  }

  // Default fallback
  const parts = cleanId.split("-");
  if (parts.length >= 2) {
    return parts.slice(0, 2).join("-");
  }
  return cleanId;
}

function normalizeModelId(modelId: string): string {
  // Remove "models/" prefix if present
  return modelId.replace(/^models\//, "");
}

export async function populateGoogleModels(apiKey: string) {
  try {
    const existingModels = await prisma.googleModel.findMany();
    if (existingModels.length > 0) {
      return existingModels;
    }

    const models = await fetchGoogleModels(apiKey);

    // Insert models in batches to avoid overwhelming the database
    const batchSize = 50;

    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map((model) => {
          const normalizedId = normalizeModelId(model.name);
          const modelFamily = extractModelFamily(normalizedId);
          const enhancement =
            MODEL_ENHANCEMENTS[normalizedId] || MODEL_ENHANCEMENTS[modelFamily];

          // Determine capabilities based on model properties
          const capabilities = [];
          if (model.supportedGenerationMethods?.includes("generateContent")) {
            capabilities.push("text");
          }
          if (
            normalizedId.includes("vision") ||
            normalizedId.includes("2.0") ||
            normalizedId.includes("2.5") ||
            normalizedId.includes("1.5")
          ) {
            capabilities.push("vision");
          }
          if (normalizedId.includes("embedding")) {
            capabilities.push("embeddings");
          }
          if (normalizedId.includes("2.5")) {
            capabilities.push("reasoning");
          }

          return prisma.googleModel.create({
            data: {
              modelId: normalizedId,
              name: model.displayName || normalizedId,
              modelFamily: modelFamily,
              description:
                enhancement?.description || model.description || null,
              contextLength:
                enhancement?.contextLength || model.inputTokenLimit || null,
              maxOutput:
                enhancement?.maxOutput || model.outputTokenLimit || null,
              pricing: enhancement?.pricing
                ? JSON.stringify(enhancement.pricing)
                : null,
              capabilities: enhancement?.capabilities
                ? JSON.stringify(enhancement.capabilities)
                : null,
              isActive: true,
            },
          });
        })
      );
    }
  } catch (error) {
    console.error("Error populating Google models:", error);
  } finally {
    await prisma.$disconnect();
  }
}
