import { useCallback, useEffect, useState } from "react";
import { PreferredModel } from "@prisma/client";
import { UnifiedModel } from "@/types/models";
import { getPreferredModels } from "@/data/models";

interface ProviderInfo {
  id: string;
  provider: string;
}

export const useModelManagement = (
  initialAvailableModels: UnifiedModel[],
  initialActiveProviders: ProviderInfo[],
  initialPreferredModels: PreferredModel[]
) => {
  const [availableModels, setAvailableModels] = useState<UnifiedModel[]>(initialAvailableModels);
  const [activeProviders, setActiveProviders] = useState<ProviderInfo[]>(initialActiveProviders);
  const [preferredModels, setPreferredModels] = useState<PreferredModel[]>(initialPreferredModels);
  
  // Initialize filtered models based on initial active providers
  const [filteredModels, setFilteredModels] = useState<UnifiedModel[]>(
    initialAvailableModels.filter((model) =>
      initialActiveProviders.some(
        (activeProvider) =>
          activeProvider.provider.toLowerCase() === model.provider.toLowerCase()
      )
    )
  );

  const refreshPreferredModels = useCallback(async () => {
    try {
      const updated = await getPreferredModels();
      setPreferredModels(updated);
    } catch (error) {
      console.error("Failed to refresh preferred models:", error);
    }
  }, []);

  // Update filtered models when active providers change
  useEffect(() => {
    setFilteredModels(
      availableModels.filter((model) =>
        activeProviders.some(
          (activeProvider) =>
            activeProvider.provider.toLowerCase() === model.provider.toLowerCase()
        )
      )
    );
  }, [activeProviders, availableModels]);

  return {
    filteredModels,
    setFilteredModels,
    activeProviders,
    setActiveProviders,
    preferredModels,
    setPreferredModels,
    refreshPreferredModels,
    availableModels,
    setAvailableModels,
  };
}; 