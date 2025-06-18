import { JsonValue } from "@prisma/client/runtime/library";

// Unified model interface for all providers
export interface UnifiedModel {
  id: string;
  modelId: string;
  name: string;
  provider: string;
  description?: string | null;
  contextLength?: number | null;
  pricing?: JsonValue | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields from provider-specific models
  modelFamily?: string;
  maxOutput?: number | null;
  capabilities?: JsonValue | null;
  direct: boolean; // true if hosted directly by provider, false if through proxy like OpenRouter
}

export type FilterType =
  | "all"
  | "vision"
  | "reasoning"
  | "code"
  | "experimental"
  | "premium"
  | "fast"
  | "direct"
  | "openrouter"
  | "google"
  | "openai"
  | "anthropic"
  | "xai"
  | "deepseek"
  | "image"
  | "websearch";
