export const getDefaultModels = (
  availableModels: Array<{
    id: string;
    name: string;
    subtitle: string;
    icon: React.ReactNode;
    capabilities: Array<{ icon: React.ReactNode; label: string }>;
    provider: string;
    isPro: boolean;
    requiresKey: boolean;
    isDisabled: boolean;
    isFavorite: boolean;
    isExperimental?: boolean;
    isNew?: boolean;
    specialStyling?: { border?: string; shadow?: string };
  }>
) => {
  if (availableModels.length === 0) return [];

  // Get unique providers
  const providers = [
    ...new Set(availableModels.map((model) => model.provider)),
  ];
  const defaults: typeof availableModels = [];

  // Default model preferences by provider (in order of preference)
  const providerDefaults: Record<string, string[]> = {
    anthropic: ["claude-3-5-sonnet", "claude-3-5-haiku", "claude-3-opus"],
    openai: ["gpt-4o", "gpt-4o-mini", "o1-preview", "o1-mini"],
    google: ["gemini-2.0-flash-exp", "gemini-1.5-pro", "gemini-1.5-flash"],
    deepseek: ["deepseek-chat", "deepseek-reasoner"],
    xai: ["grok-beta", "grok-vision-beta"],
    openrouter: [
      "anthropic/claude-3.5-sonnet",
      "openai/gpt-4o",
      "google/gemini-2.0-flash-exp",
    ],
  };

  // For each provider, try to find the best available model
  providers.forEach((provider) => {
    const providerModels = availableModels.filter(
      (model) => model.provider === provider
    );
    const preferredNames = providerDefaults[provider] || [];

    // Try to find preferred models in order
    for (const preferredName of preferredNames) {
      const found = providerModels.find(
        (model) =>
          (model.name?.toLowerCase()?.includes(preferredName.toLowerCase()) ??
            false) ||
          (model.id?.toLowerCase()?.includes(preferredName.toLowerCase()) ??
            false)
      );
      if (found && !defaults.some((d) => d.id === found.id)) {
        defaults.push(found);
        break; // Only add one model per provider for now
      }
    }

    // If no preferred model found, add the first non-pro model from this provider
    if (!defaults.some((d) => d.provider === provider)) {
      const fallback =
        providerModels.find(
          (model) => !model.isPro && !model.requiresKey && !model.isDisabled
        ) || providerModels[0]; // Fallback to first model if all are pro/require keys

      if (fallback && !defaults.some((d) => d.id === fallback.id)) {
        defaults.push(fallback);
      }
    }
  });

  // Limit to 8 default models to avoid overwhelming the user
  return defaults.slice(0, 8);
};

export const getSpecialStyling = (
  name: string
): { border?: string; shadow?: string } => {
  const lowercaseName = name.toLowerCase();

  if (lowercaseName.includes("o3") && lowercaseName.includes("pro")) {
    return {
      border: "border-[#ffb525f7]",
      shadow:
        "shadow-[0px_3px_8px_#ffae1082,inset_0px_-4px_20px_#ffb52575] dark:border-amber-200/80 dark:shadow-[0px_3px_8px_rgba(186,130,21,0.32),inset_0px_-4px_20px_rgba(186,130,21,0.43)]",
    };
  }

  return {};
};
