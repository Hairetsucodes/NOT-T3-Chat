import { z } from "zod";

// Schema for generating and applying personalized prompt
export const GeneratePersonalizedPromptSchema = z.object({
  provider: z
    .string()
    .min(1, "Provider is required")
    .max(50, "Provider name is too long")
    .trim(),
  modelId: z
    .string()
    .min(1, "Model ID is required")
    .max(100, "Model ID is too long")
    .trim(),
  apiKey: z
    .string()
    .min(1, "API key is required"),
});

// Type exports for TypeScript
export type GeneratePersonalizedPromptRequest = z.infer<typeof GeneratePersonalizedPromptSchema>; 