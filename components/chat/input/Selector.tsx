"use client";

import {
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
} from "react";
import { Search, ChevronDown, Pin, ChevronUp, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ModelCard } from "./models/Card";
import { ModelListItem } from "./models/ListItem";
import { ChatContext } from "@/context/ChatContext";
import { getProviderIcon } from "@/components/ui/provider-images";
import { ChatSettings } from "@prisma/client";
import { updateModelAndProvider } from "@/data/settings";
import { getCapabilities } from "@/components/settings/tab/models/capability";
import { getDefaultModels, getSpecialStyling } from "./models/helpers";

// Custom hook for debounced value
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

const ModelSelector = memo(function ModelSelector() {
  const {
    preferredModels,
    availableModels: dbModels,
    chatSettings,
    setChatSettings,
    activeUser,
    activeProviders,
  } = useContext(ChatContext);

  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);

  // Debounce search query to improve performance
  const debouncedSearchQuery = useDebounce(searchQuery, 200);

  // Memoize preferred model IDs set
  const preferredModelIds = useMemo(
    () => new Set(preferredModels.map((pm) => pm.model)),
    [preferredModels]
  );

  // Memoize available models conversion - only show models from active providers
  const availableModels = useMemo(() => {
    const activeProviderNames = new Set(activeProviders.map((p) => p.provider));

    return dbModels
      .filter(
        (model) =>
          activeProviderNames.has(model.provider) && model.modelId && model.name
      )
      .map((model) => {
        const icon = getProviderIcon(model.provider, "h-8 w-8 bg-transparent");
        const capabilities = getCapabilities(
          model.provider,
          model.name,
          model.description
        );
        const isPro = false;
        const requiresApiKey = true;
        const isNew = false;
        const specialStyling = getSpecialStyling(model.name);

        return {
          id: model.modelId,
          name: model.name,
          subtitle: model.modelFamily || "",
          icon: icon,
          capabilities,
          provider: model.provider,
          isPro,
          isDisabled: false,
          isFavorite: preferredModelIds.has(model.modelId),
          isExperimental: false,
          requiresKey: requiresApiKey,
          isNew,
          specialStyling,
        };
      });
  }, [dbModels, preferredModelIds, activeProviders]);

  // Memoize default models when no preferences exist
  const defaultModels = useMemo(() => {
    if (preferredModels.length > 0) return [];
    return getDefaultModels(availableModels).map((model) => ({
      ...model,
      isFavorite: true, // Mark as favorite for display purposes only
    }));
  }, [availableModels, preferredModels.length]);

  // Memoize filtered models
  const { favoriteModels, otherModels, enabledModels } = useMemo(() => {
    const enabled = availableModels.filter((model) => !model.isDisabled);

    // Use actual favorites if they exist, otherwise use defaults
    const favorites =
      preferredModels.length > 0
        ? availableModels.filter((model) => model.isFavorite)
        : defaultModels;

    const others = availableModels.filter((model) => !model.isFavorite);

    return {
      favoriteModels: favorites,
      otherModels: others,
      enabledModels: enabled,
    };
  }, [availableModels, defaultModels, preferredModels.length]);

  // Memoize search filtered models
  const filteredModels = useMemo(() => {
    const modelsToShow = showAllModels ? availableModels : favoriteModels;
    return modelsToShow.filter((model) =>
      model.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
  }, [availableModels, favoriteModels, showAllModels, debouncedSearchQuery]);

  // Memoize filtered favorites and others for cards view
  const { filteredFavorites, filteredOthers } = useMemo(() => {
    const favorites = favoriteModels.filter((model) =>
      model.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );
    const others = otherModels.filter((model) =>
      model.name.toLowerCase().includes(debouncedSearchQuery.toLowerCase())
    );

    return { filteredFavorites: favorites, filteredOthers: others };
  }, [favoriteModels, otherModels, debouncedSearchQuery]);

  // Memoize handlers
  const handleModelSelect = useCallback(
    (modelId: string) => {
      const selectedModelData = availableModels.find(
        (model) => model.id === modelId
      );
      if (selectedModelData && activeUser) {
        setChatSettings({
          ...chatSettings,
          model: modelId,
          provider: selectedModelData.provider,
        } as ChatSettings);

        updateModelAndProvider(modelId, selectedModelData.provider);
      }
      setIsOpen(false);
    },
    [availableModels, setChatSettings, chatSettings, activeUser]
  );

  const toggleShowAll = useCallback(() => {
    setShowAllModels(!showAllModels);
  }, [showAllModels]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (!open) {
      // Reset to favorites when popover closes
      setShowAllModels(false);
      setSearchQuery("");
    }
  }, []);

  // If no models are available, show a fallback
  if (enabledModels.length === 0) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="text-xs h-auto gap-2 rounded-full border-secondary-foreground/10 py-1.5 pl-2 pr-2.5 text-muted-foreground max-sm:p-2"
        disabled
      >
        <div className="flex items-center gap-2 text-sm">
          <div className="w-4 h-4 bg-muted-foreground/20 rounded"></div>
          <span>No models available</span>
        </div>
      </Button>
    );
  }

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-auto gap-2 rounded-full border-secondary-foreground/10 py-1.5 pl-2 pr-2.5 text-muted-foreground max-sm:p-2"
        >
          <div className="flex items-center gap-2 text-sm">
            {getProviderIcon(chatSettings?.provider || "", "bg-transparent")}

            <span>{chatSettings?.model}</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={`w-auto ${
          showAllModels ? "sm:w-[640px] max-h-[80vh]" : "sm:w-[420px]"
        }  p-0 overflow-hidden`}
        align="start"
      >
        <div className="flex flex-col h-full max-h-[80vh] relative">
          {/* Fixed Search Header */}
          <div className="z-10 fixed inset-x-4 top-0 rounded-t-lg bg-popover px-3.5 pt-0.5 sm:inset-x-0">
            {" "}
            <div className="flex items-center">
              <Search className="ml-px mr-3 !size-4 text-muted-foreground/75" />
              <Input
                role="searchbox"
                aria-label="Search models"
                placeholder="Search models..."
                value={searchQuery}
                onChange={handleSearchChange}
                className="w-full bg-transparent py-2 text-sm text-foreground placeholder-muted-foreground/50 placeholder:select-none focus:outline-none border-none focus:ring-0"
              />
            </div>
            <div className="border-b border-chat-border px-3"></div>
          </div>

          {/* Models Content - Scrollable */}
          <div className="flex-1 overflow-y-auto px-1.5 scroll-shadow pt-10 pb-11">
            {showAllModels ? (
              /* Cards View - Show All */
              <div className="flex w-full flex-wrap justify-start gap-3.5 pb-4 pl-3 pr-2 pt-2.5">
                {/* Favorites Section */}
                <div className="-mb-2 ml-0 flex w-full select-none items-center justify-start gap-1.5 text-color-heading">
                  <Pin className="mt-px size-4" />
                  Favorites
                </div>

                {filteredFavorites.map((model) => (
                  <ModelCard
                    key={model.id}
                    model={model}
                    onSelect={handleModelSelect}
                  />
                ))}

                {/* Others Section */}
                {filteredOthers.length > 0 && (
                  <>
                    <div className="-mb-2 ml-2 mt-1 w-full select-none text-color-heading">
                      Others
                    </div>
                    {filteredOthers.map((model) => (
                      <ModelCard
                        key={model.id}
                        model={model}
                        onSelect={handleModelSelect}
                      />
                    ))}
                  </>
                )}
              </div>
            ) : (
              /* List View - Favorites Only */
              <div className="max-h-full  px-1.5 scroll-shadow">
                {filteredModels.map((model) => (
                  <ModelListItem
                    key={model.id}
                    model={model}
                    onSelect={handleModelSelect}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Fixed Bottom Bar */}
          <div className="fixed inset-x-4 bottom-0 flex items-center justify-between rounded-b-lg bg-popover pb-1 pl-1 pr-2.5 pt-1.5 sm:inset-x-0">
            <div className="absolute inset-x-3 top-0 border-b border-chat-border"></div>
            <Button
              variant="ghost"
              className="justify-center whitespace-nowrap rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50 h-9 px-4 py-2 flex items-center gap-2 pl-2 text-muted-foreground"
              onClick={toggleShowAll}
            >
              <ChevronUp className="h-4 w-4" />
              {showAllModels ? "Show favorites" : "Show all"}
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                className="inline-flex items-center justify-center whitespace-nowrap font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 hover:bg-muted/40 hover:text-foreground disabled:hover:bg-transparent disabled:hover:text-foreground/50 h-8 rounded-md text-xs relative gap-2 px-2 text-muted-foreground"
              >
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
});

export default ModelSelector;
