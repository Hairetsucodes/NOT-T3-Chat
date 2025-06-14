/**
 * Utility functions for string manipulation
 */

export function capitalizeProvider(provider: string): string {
  return provider.charAt(0).toUpperCase() + provider.slice(1);
} 