/**
 * Utility functions for validation
 */

import { SUPPORTED_PROVIDERS } from "@/constants/supportedProviders";
import { SupportedProvider } from "@/types/chat";
import { createErrorResponse } from "./response";
import { capitalizeProvider } from "./string";

export function validateProviderKey(
  providerKey: string | null,
  provider: string
) {
  if (
    !providerKey &&
    !SUPPORTED_PROVIDERS.includes(provider as SupportedProvider)
  ) {
    return createErrorResponse(
      "OpenRouter API key not found. This model requires an OpenRouter API key. Please add your OpenRouter API key in settings."
    );
  }

  if (!providerKey) {
    const providerName = capitalizeProvider(provider);
    return createErrorResponse(
      `${providerName} API key not found. Please add your ${providerName} API key in settings.`
    );
  }

  return null;
} 