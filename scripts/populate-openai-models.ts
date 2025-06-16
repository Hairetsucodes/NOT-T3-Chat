import { prisma } from "@/prisma";

interface OpenAIModel {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

interface OpenAIResponse {
  object: string;
  data: OpenAIModel[];
}

// Enhanced model data based on OpenAI documentation
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
  "gpt-4o": {
    description:
      "GPT-4o is our most advanced, multimodal flagship model that's cheaper and faster than GPT-4 Turbo. Currently points to gpt-4o-2024-08-06.",
    contextLength: 128000,
    maxOutput: 16384,
    pricing: {
      prompt: "0.005",
      completion: "0.015",
    },
    capabilities: ["text", "vision", "function_calling"],
  },
  "gpt-4o-mini": {
    description:
      "GPT-4o mini is our affordable and intelligent small model for fast, lightweight tasks. GPT-4o mini is cheaper and more capable than GPT-3.5 Turbo.",
    contextLength: 128000,
    maxOutput: 16384,
    pricing: {
      prompt: "0.00015",
      completion: "0.0006",
    },
    capabilities: ["text", "vision", "function_calling"],
  },
  "gpt-4-turbo": {
    description:
      "GPT-4 Turbo with Vision. The latest GPT-4 Turbo model with vision capabilities. Vision requests can now use JSON mode and function calling.",
    contextLength: 128000,
    maxOutput: 4096,
    pricing: {
      prompt: "0.01",
      completion: "0.03",
    },
    capabilities: ["text", "vision", "function_calling", "json_mode"],
  },
  "gpt-4": {
    description:
      "Currently points to gpt-4-0613. See continuous model upgrades.",
    contextLength: 8192,
    maxOutput: 8192,
    pricing: {
      prompt: "0.03",
      completion: "0.06",
    },
    capabilities: ["text", "function_calling"],
  },
  "gpt-3.5-turbo": {
    description:
      "Currently points to gpt-3.5-turbo-0125. The latest GPT-3.5 Turbo model with higher accuracy at responding in requested formats and a fix for a bug which caused a text encoding issue for non-English language function calls.",
    contextLength: 16385,
    maxOutput: 4096,
    pricing: {
      prompt: "0.0005",
      completion: "0.0015",
    },
    capabilities: ["text", "function_calling", "json_mode"],
  },
  "o1-preview": {
    description:
      "o1-preview is designed to reason about hard problems using broad general knowledge about the world. Currently in beta.",
    contextLength: 128000,
    maxOutput: 32768,
    pricing: {
      prompt: "0.015",
      completion: "0.06",
    },
    capabilities: ["text", "reasoning"],
  },
  "o1-mini": {
    description:
      "o1-mini is a faster and cheaper version of o1, particularly effective for coding, math, and science tasks that don't require broad world knowledge.",
    contextLength: 128000,
    maxOutput: 65536,
    pricing: {
      prompt: "0.003",
      completion: "0.012",
    },
    capabilities: ["text", "reasoning"],
  },
  "o3-mini": {
    description:
      "o3-mini is our latest reasoning model, offering improved performance on challenging tasks while being more cost-effective than o1.",
    contextLength: 200000,
    maxOutput: 65536,
    pricing: {
      prompt: "0.0025",
      completion: "0.01",
    },
    capabilities: ["text", "reasoning"],
  },
  "dall-e-3": {
    description:
      "DALL·E 3 understands significantly more nuance and detail than our previous systems, allowing you to easily translate your ideas into exceptionally accurate images.",
    contextLength: 4000,
    maxOutput: 1,
    pricing: {
      prompt: "0",
      completion: "0",
      image: "0.040",
    },
    capabilities: ["image_generation"],
  },
  "dall-e-2": {
    description:
      "DALL·E 2 can create original, realistic images and art from a text description. It can combine concepts, attributes, and styles.",
    contextLength: 1000,
    maxOutput: 1,
    pricing: {
      prompt: "0",
      completion: "0",
      image: "0.020",
    },
    capabilities: ["image_generation"],
  },
  "whisper-1": {
    description:
      "Whisper is a general-purpose speech recognition model. It is trained on a large dataset of diverse audio.",
    contextLength: 25000000, // 25MB file limit
    maxOutput: 1,
    pricing: {
      prompt: "0.006", // per minute
      completion: "0",
    },
    capabilities: ["audio_transcription", "audio_translation"],
  },
  "tts-1": {
    description: "The latest text to speech model, optimized for speed.",
    contextLength: 4096,
    maxOutput: 1,
    pricing: {
      prompt: "0.015", // per 1K characters
      completion: "0",
    },
    capabilities: ["text_to_speech"],
  },
  "tts-1-hd": {
    description: "The latest text to speech model, optimized for quality.",
    contextLength: 4096,
    maxOutput: 1,
    pricing: {
      prompt: "0.030", // per 1K characters
      completion: "0",
    },
    capabilities: ["text_to_speech"],
  },
  "text-embedding-3-large": {
    description:
      "Most capable embedding model for both english and non-english tasks",
    contextLength: 8191,
    maxOutput: 3072, // embedding dimensions
    pricing: {
      prompt: "0.00013", // per 1K tokens
      completion: "0",
    },
    capabilities: ["embeddings"],
  },
  "text-embedding-3-small": {
    description:
      "Increased performance over 2nd generation ada embedding model",
    contextLength: 8191,
    maxOutput: 1536, // embedding dimensions
    pricing: {
      prompt: "0.00002", // per 1K tokens
      completion: "0",
    },
    capabilities: ["embeddings"],
  },
  "text-embedding-ada-002": {
    description:
      "Most capable 2nd generation embedding model, replacing 16 first generation models",
    contextLength: 8191,
    maxOutput: 1536, // embedding dimensions
    pricing: {
      prompt: "0.0001", // per 1K tokens
      completion: "0",
    },
    capabilities: ["embeddings"],
  },
};

async function fetchOpenAIModels(apiKey: string): Promise<OpenAIModel[]> {
  try {
    const response = await fetch("https://api.openai.com/v1/models", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: OpenAIResponse = await response.json();
    return data.data;
  } catch (error) {
    console.error("Error fetching models:", error);
    throw error;
  }
}

function extractModelFamily(modelId: string): string {
  // Extract model family from model ID (e.g., "gpt-4o-2024-08-06" -> "gpt-4o")
  if (modelId.startsWith("gpt-4o")) {
    return "gpt-4o";
  } else if (modelId.startsWith("gpt-4-turbo")) {
    return "gpt-4-turbo";
  } else if (modelId.startsWith("gpt-4")) {
    return "gpt-4";
  } else if (modelId.startsWith("gpt-3.5-turbo")) {
    return "gpt-3.5-turbo";
  } else if (modelId.startsWith("o1-preview")) {
    return "o1-preview";
  } else if (modelId.startsWith("o1-mini")) {
    return "o1-mini";
  } else if (modelId.startsWith("o3-mini")) {
    return "o3-mini";
  } else if (modelId.startsWith("dall-e")) {
    return modelId.includes("3") ? "dall-e-3" : "dall-e-2";
  } else if (modelId.startsWith("whisper")) {
    return "whisper";
  } else if (modelId.startsWith("tts")) {
    return modelId.includes("hd") ? "tts-1-hd" : "tts-1";
  } else if (modelId.startsWith("text-embedding")) {
    if (modelId.includes("3-large")) return "text-embedding-3-large";
    if (modelId.includes("3-small")) return "text-embedding-3-small";
    return "text-embedding-ada-002";
  }

  // Default fallback
  const parts = modelId.split("-");
  if (parts.length >= 2) {
    return parts.slice(0, 2).join("-");
  }
  return modelId;
}

export async function populateOpenAIModels(apiKey: string) {
  try {
    const existingModels = await prisma.openaiModel.findMany();
    if (existingModels.length > 0) {
      return existingModels;
    }

    const models = await fetchOpenAIModels(apiKey);

    // Insert models in batches to avoid overwhelming the database
    const batchSize = 50;

    for (let i = 0; i < models.length; i += batchSize) {
      const batch = models.slice(i, i + batchSize);

      await prisma.$transaction(
        batch.map((model) => {
          const modelFamily = extractModelFamily(model.id);
          const enhancement =
            MODEL_ENHANCEMENTS[model.id] || MODEL_ENHANCEMENTS[modelFamily];

          return prisma.openaiModel.create({
            data: {
              modelId: model.id,
              name: model.id, // OpenAI uses model ID as name
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
  } catch (error) {
    console.error("Error populating OpenAI models:", error);
  } finally {
    await prisma.$disconnect();
  }
}
