import { z } from "zod";

// Schema for getting models by provider
export const GetModelsByProviderSchema = z.object({
  provider: z
    .string()
    .min(1, "Provider is required")
    .max(50, "Provider name is too long")
    .trim()
    .toLowerCase(),
});

// Schema for getting model by ID
export const GetModelByIdSchema = z.object({
  modelId: z
    .string()
    .min(1, "Model ID is required")
    .max(100, "Model ID is too long")
    .trim(),
});

// Schema for searching models
export const SearchModelsSchema = z.object({
  query: z
    .string()
    .min(1, "Search query cannot be empty")
    .max(100, "Search query is too long")
    .trim(),
});

// Schema for adding a preferred model
export const AddPreferredModelSchema = z.object({
  modelId: z
    .string()
    .min(1, "Model ID is required")
    .max(100, "Model ID is too long")
    .trim(),
  provider: z
    .string()
    .min(1, "Provider is required")
    .max(50, "Provider name is too long")
    .trim()
    .toLowerCase(),
});

// Schema for removing a preferred model
export const RemovePreferredModelSchema = z.object({
  modelId: z
    .string()
    .min(1, "Model ID is required")
    .max(100, "Model ID is too long")
    .trim(),
});

// Type exports for TypeScript
export type GetModelsByProviderRequest = z.infer<typeof GetModelsByProviderSchema>;
export type GetModelByIdRequest = z.infer<typeof GetModelByIdSchema>;
export type SearchModelsRequest = z.infer<typeof SearchModelsSchema>;
export type AddPreferredModelRequest = z.infer<typeof AddPreferredModelSchema>;
export type RemovePreferredModelRequest = z.infer<typeof RemovePreferredModelSchema>; 