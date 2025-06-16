import { ProviderConfig } from "@/types/llms";
import { xaiConfig } from "./xai";
import { openrouterConfig } from "./openrouter";
import { anthropicConfig } from "./anthropic";
import { deepseekConfig } from "./deepseek";

export const PROVIDER_CONFIGS: Record<string, ProviderConfig> = {
  xai: xaiConfig,
  openrouter: openrouterConfig,
  anthropic: anthropicConfig,
  deepseek: deepseekConfig,
};

export { callGoogleStreaming, callGoogleNonStreaming } from "./google";

export function getProviderConfig(provider: string): ProviderConfig {
  const config = PROVIDER_CONFIGS[provider.toLowerCase()];
  if (!config) {
    // Default to OpenRouter for unknown providers
    return PROVIDER_CONFIGS.openrouter;
  }
  return config;
}

export function getProviderName(provider: string): string {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
}
