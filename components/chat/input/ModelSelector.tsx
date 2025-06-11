"use client";

import { useContext, useState, useEffect, useMemo, useCallback } from "react";
import { Search, ChevronDown, Pin, ChevronUp, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ModelCard } from "./ModelCard";
import { ModelListItem } from "./ModelListItem";
import { ChatContext } from "@/context/ChatContext";
const GeminiIcon = () => (
  <svg
    className="size-7 text-[--model-primary]"
    viewBox="0 0 16 16"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <title>Gemini</title>
    <path d="M16 8.016A8.522 8.522 0 008.016 16h-.032A8.521 8.521 0 000 8.016v-.032A8.521 8.521 0 007.984 0h.032A8.522 8.522 0 0016 7.984v.032z"></path>
  </svg>
);

const OpenAIIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="118 120 480 480"
    fill="currentColor"
    className="size-7 text-[--model-primary]"
  >
    <path d="M304.246 295.411V249.828C304.246 245.989 305.687 243.109 309.044 241.191L400.692 188.412C413.167 181.215 428.042 177.858 443.394 177.858C500.971 177.858 537.44 222.482 537.44 269.982C537.44 273.34 537.44 277.179 536.959 281.018L441.954 225.358C436.197 222 430.437 222 424.68 225.358L304.246 295.411ZM518.245 472.945V364.024C518.245 357.304 515.364 352.507 509.608 349.149L389.174 279.096L428.519 256.543C431.877 254.626 434.757 254.626 438.115 256.543L529.762 309.323C556.154 324.679 573.905 357.304 573.905 388.971C573.905 425.436 552.315 459.024 518.245 472.941V472.945ZM275.937 376.982L236.592 353.952C233.235 352.034 231.794 349.154 231.794 345.315V239.756C231.794 188.416 271.139 149.548 324.4 149.548C344.555 149.548 363.264 156.268 379.102 168.262L284.578 222.964C278.822 226.321 275.942 231.119 275.942 237.838V376.986L275.937 376.982ZM360.626 425.922L304.246 394.255V327.083L360.626 295.416L417.002 327.083V394.255L360.626 425.922ZM396.852 571.789C376.698 571.789 357.989 565.07 342.151 553.075L436.674 498.374C442.431 495.017 445.311 490.219 445.311 483.499V344.352L485.138 367.382C488.495 369.299 489.936 372.179 489.936 376.018V481.577C489.936 532.917 450.109 571.785 396.852 571.785V571.789ZM283.134 464.79L191.486 412.01C165.094 396.654 147.343 364.029 147.343 332.362C147.343 295.416 169.415 262.309 203.48 248.393V357.791C203.48 364.51 206.361 369.308 212.117 372.665L332.074 442.237L292.729 464.79C289.372 466.707 286.491 466.707 283.134 464.79ZM277.859 543.48C223.639 543.48 183.813 502.695 183.813 452.314C183.813 448.475 184.294 444.636 184.771 440.797L279.295 495.498C285.051 498.856 290.812 498.856 296.568 495.498L417.002 425.927V471.509C417.002 475.349 415.562 478.229 412.204 480.146L320.557 532.926C308.081 540.122 293.206 543.48 277.854 543.48H277.859ZM396.852 600.576C454.911 600.576 503.37 559.313 514.41 504.612C568.149 490.696 602.696 440.315 602.696 388.976C602.696 355.387 588.303 322.762 562.392 299.25C564.791 289.173 566.231 279.096 566.231 269.024C566.231 200.411 510.571 149.067 446.274 149.067C433.322 149.067 420.846 150.984 408.37 155.305C386.775 134.192 357.026 120.758 324.4 120.758C266.342 120.758 217.883 162.02 206.843 216.721C153.104 230.637 118.557 281.018 118.557 332.357C118.557 365.946 132.95 398.571 158.861 422.083C156.462 432.16 155.022 442.237 155.022 452.309C155.022 520.922 210.682 572.266 274.978 572.266C287.931 572.266 300.407 570.349 312.883 566.028C334.473 587.141 364.222 600.576 396.852 600.576Z"></path>
  </svg>
);

const AnthropicIcon = () => (
  <svg
    className="size-7 text-[--model-primary]"
    viewBox="0 0 46 32"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <title>Anthropic</title>
    <path d="M32.73 0h-6.945L38.45 32h6.945L32.73 0ZM12.665 0 0 32h7.082l2.59-6.72h13.25l2.59 6.72h7.082L19.929 0h-7.264Zm-.702 19.337 4.334-11.246 4.334 11.246h-8.668Z"></path>
  </svg>
);

const DeepSeekIcon = () => (
  <svg
    className="size-7 text-[--model-primary]"
    viewBox="0 0 24 24"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <title>DeepSeek</title>
    <path d="M23.748 4.482c-.254-.124-.364.113-.512.234-.051.039-.094.09-.137.136-.372.397-.806.657-1.373.626-.829-.046-1.537.214-2.163.848-.133-.782-.575-1.248-1.247-1.548-.352-.156-.708-.311-.955-.65-.172-.241-.219-.51-.305-.774-.055-.16-.11-.323-.293-.35-.2-.031-.278.136-.356.276-.313.572-.434 1.202-.422 1.84.027 1.436.633 2.58 1.838 3.393.137.093.172.187.129.323-.082.28-.18.552-.266.833-.055.179-.137.217-.329.14a5.526 5.526 0 01-1.736-1.18c-.857-.828-1.631-1.742-2.597-2.458a11.365 11.365 0 00-.689-.471c-.985-.957.13-1.743.388-1.836.27-.098.093-.432-.779-.428-.872.004-1.67.295-2.687.684a3.055 3.055 0 01-.465.137 9.597 9.597 0 00-2.883-.102c-1.885.21-3.39 1.102-4.497 2.623C.082 8.606-.231 10.684.152 12.85c.403 2.284 1.569 4.175 3.36 5.653 1.858 1.533 3.997 2.284 6.438 2.14 1.482-.085 3.133-.284 4.994-1.86.47.234.962.327 1.78.397.63.059 1.236-.03 1.705-.128.735-.156.684-.837.419-.961-2.155-1.004-1.682-.595-2.113-.926 1.096-1.296 2.746-2.642 3.392-7.003.05-.347.007-.565 0-.845-.004-.17.035-.237.23-.256a4.173 4.173 0 001.545-.475c1.396-.763 1.96-2.015 2.093-3.517.02-.23-.004-.467-.247-.588zM11.581 18c-2.089-1.642-3.102-2.183-3.52-2.16-.392.024-.321.471-.235.763.09.288.207.486.371.739.114.167.192.416-.113.603-.673.416-1.842-.14-1.897-.167-1.361-.802-2.5-1.86-3.301-3.307-.774-1.393-1.224-2.887-1.298-4.482-.02-.386.093-.522.477-.592a4.696 4.696 0 011.529-.039c2.132.312 3.946 1.265 5.468 2.774.868.86 1.525 1.887 2.202 2.891.72 1.066 1.494 2.082 2.48 2.914.348.292.625.514.891.677-.802.09-2.14.11-3.054-.614zm1-6.44a.306.306 0 01.415-.287.302.302 0 01.2.288.306.306 0 01-.31.307.303.303 0 01-.304-.308zm3.11 1.596c-.2.081-.399.151-.59.16a1.245 1.245 0 01-.798-.254c-.274-.23-.47-.358-.552-.758a1.73 1.73 0 01.016-.588c.07-.327-.008-.537-.239-.727-.187-.156-.426-.199-.688-.199a.559.559 0 01-.254-.078c-.11-.054-.2-.19-.114-.358.028-.054.16-.186.192-.21.356-.202.767-.136 1.146.016.352.144.618.408 1.001.782.391.451.462.576.685.914.176.265.336.537.445.848.067.195-.019.354-.25.452z"></path>
  </svg>
);

const MetaIcon = () => (
  <svg
    className="size-7 text-[--model-primary]"
    viewBox="0 0 256 171"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <title>Meta</title>
    <path d="M27.651 112.136c0 9.775 2.146 17.28 4.95 21.82 3.677 5.947 9.16 8.466 14.751 8.466 7.211 0 13.808-1.79 26.52-19.372 10.185-14.092 22.186-33.874 30.26-46.275l13.675-21.01c9.499-14.591 20.493-30.811 33.1-41.806C161.196 4.985 172.298 0 183.47 0c18.758 0 36.625 10.87 50.3 31.257C248.735 53.584 256 81.707 256 110.729c0 17.253-3.4 29.93-9.187 39.946-5.591 9.686-16.488 19.363-34.818 19.363v-27.616c15.695 0 19.612-14.422 19.612-30.927 0-23.52-5.484-49.623-17.564-68.273-8.574-13.23-19.684-21.313-31.907-21.313-13.22 0-23.859 9.97-35.815 27.75-6.356 9.445-12.882 20.956-20.208 33.944l-8.066 14.289c-16.203 28.728-20.307 35.271-28.408 46.07-14.2 18.91-26.324 26.076-42.287 26.076-18.935 0-30.91-8.2-38.325-20.556C2.973 139.413 0 126.202 0 111.148l27.651.988Z"></path>
    <path d="M21.802 33.206C34.48 13.666 52.774 0 73.757 0 85.91 0 97.99 3.597 110.605 13.897c13.798 11.261 28.505 29.805 46.853 60.368l6.58 10.967c15.881 26.459 24.917 40.07 30.205 46.49 6.802 8.243 11.565 10.7 17.752 10.7 15.695 0 19.612-14.422 19.612-30.927l24.393-.766c0 17.253-3.4 29.93-9.187 39.946-5.591 9.686-16.488 19.363-34.818 19.363-11.395 0-21.49-2.475-32.654-13.007-8.582-8.083-18.615-22.443-26.334-35.352l-22.96-38.352C118.528 64.08 107.96 49.73 101.845 43.23c-6.578-6.988-15.036-15.428-28.532-15.428-10.923 0-20.2 7.666-27.963 19.39L21.802 33.206Z"></path>
    <path d="M73.312 27.802c-10.923 0-20.2 7.666-27.963 19.39-10.976 16.568-17.698 41.245-17.698 64.944 0 9.775 2.146 17.28 4.95 21.82L9.027 149.482C2.973 139.413 0 126.202 0 111.148 0 83.772 7.514 55.24 21.802 33.206 34.48 13.666 52.774 0 73.757 0l-.445 27.802Z"></path>
  </svg>
);

const OpenRouterIcon = () => (
  <svg
    fill="currentColor"
    fillRule="evenodd"
    height="1em"
    viewBox="0 0 24 24"
    width="1em"
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>OpenRouter</title>
    <path d="M16.804 1.957l7.22 4.105v.087L16.73 10.21l.017-2.117-.821-.03c-1.059-.028-1.611.002-2.268.11-1.064.175-2.038.577-3.147 1.352L8.345 11.03c-.284.195-.495.336-.68.455l-.515.322-.397.234.385.23.53.338c.476.314 1.17.796 2.701 1.866 1.11.775 2.083 1.177 3.147 1.352l.3.045c.694.091 1.375.094 2.825.033l.022-2.159 7.22 4.105v.087L16.589 22l.014-1.862-.635.022c-1.386.042-2.137.002-3.138-.162-1.694-.28-3.26-.926-4.881-2.059l-2.158-1.5a21.997 21.997 0 00-.755-.498l-.467-.28a55.927 55.927 0 00-.76-.43C2.908 14.73.563 14.116 0 14.116V9.888l.14.004c.564-.007 2.91-.622 3.809-1.124l1.016-.58.438-.274c.428-.28 1.072-.726 2.686-1.853 1.621-1.133 3.186-1.78 4.881-2.059 1.152-.19 1.974-.213 3.814-.138l.02-1.907z"></path>
  </svg>
);

const GrokIcon = () => (
  <svg
    viewBox="0 0 33 32"
    className="size-7 text-[--model-primary]"
    xmlns="http://www.w3.org/2000/svg"
    fill="currentColor"
  >
    <g>
      <path d="M12.745 20.54l10.97-8.19c.539-.4 1.307-.244 1.564.38 1.349 3.288.746 7.241-1.938 9.955-2.683 2.714-6.417 3.31-9.83 1.954l-3.728 1.745c5.347 3.697 11.84 2.782 15.898-1.324 3.219-3.255 4.216-7.692 3.284-11.693l.008.009c-1.351-5.878.332-8.227 3.782-13.031L33 0l-4.54 4.59v-.014L12.743 20.544m-2.263 1.987c-3.837-3.707-3.175-9.446.1-12.755 2.42-2.449 6.388-3.448 9.852-1.979l3.72-1.737c-.67-.49-1.53-1.017-2.515-1.387-4.455-1.854-9.789-.931-13.41 2.728-3.483 3.523-4.579 8.94-2.697 13.561 1.405 3.454-.899 5.898-3.22 8.364C1.49 30.2.666 31.074 0 32l10.478-9.466"></path>
    </g>
  </svg>
);
// Helper function to get provider icon
const getProviderIcon = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "openai":
      return <OpenAIIcon />;
    case "anthropic":
      return <AnthropicIcon />;
    case "google":
      return <GeminiIcon />;
    case "deepseek":
      return <DeepSeekIcon />;
    case "xai":
      return <GrokIcon />;
    case "llama":
      return <MetaIcon />;
    default:
      return <OpenRouterIcon />;
  }
};

// Helper function to detect if model is pro/premium
const isProModel = (name: string, pricing: unknown): boolean => {
  const lowercaseName = name.toLowerCase();
  const nameBasedCheck =
    lowercaseName.includes("pro") ||
    lowercaseName.includes("plus") ||
    lowercaseName.includes("opus") ||
    lowercaseName.includes("sonnet");

  // Check pricing if it's an object with a prompt property
  const pricingBasedCheck =
    pricing &&
    typeof pricing === "object" &&
    pricing !== null &&
    "prompt" in pricing &&
    typeof (pricing as { prompt: unknown }).prompt === "number" &&
    (pricing as { prompt: number }).prompt > 0.005;

  return nameBasedCheck || Boolean(pricingBasedCheck);
};

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

export default function ModelSelector() {
  const { preferredModels, availableModels: dbModels, selectedModel, setSelectedModel } =
    useContext(ChatContext);
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

  // Memoize available models conversion
  const availableModels = useMemo(
    () =>
      dbModels.map((model) => {
        // Determine the correct icon: OpenRouter if not direct or has "/" in modelId
        const shouldUseOpenRouter = !model.direct || model.modelId.includes("/");
        const icon = shouldUseOpenRouter ? <OpenRouterIcon /> : getProviderIcon(model.provider);

        return {
          id: model.modelId,
          name: model.name,
          subtitle: model.modelFamily || "",
          icon: icon,
          capabilities: [],
          provider: model.provider,
          isPro: isProModel(model.name, model.pricing),
          isDisabled: false,
          isFavorite: preferredModelIds.has(model.modelId),
        };
      }),
    [dbModels, preferredModelIds]
  );

  // Memoize filtered models
  const { favoriteModels, otherModels, enabledModels } = useMemo(() => {
    const enabled = availableModels.filter((model) => !model.isDisabled);
    const favorites = availableModels.filter((model) => model.isFavorite);
    const others = availableModels.filter((model) => !model.isFavorite);

    return {
      favoriteModels: favorites,
      otherModels: others,
      enabledModels: enabled,
    };
  }, [availableModels]);

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

  // Memoize selected model data
  const selectedModelData = useMemo(
    () => availableModels.find((model) => model.id === selectedModel.model),
    [availableModels, selectedModel]
  );

  // Ensure selected model is available, otherwise select first available
  useEffect(() => {
    if (
      enabledModels.length > 0 &&
      !enabledModels.find((model) => model.id === selectedModel.model)
    ) {
      const firstModel = enabledModels[0];
      setSelectedModel({
        model: firstModel.id,
        provider: firstModel.provider,
      });
    }
  }, [enabledModels, selectedModel, setSelectedModel]);

  // Memoize handlers
  const handleModelSelect = useCallback((modelId: string) => {
    const selectedModelData = availableModels.find((model) => model.id === modelId);
    if (selectedModelData) {
      // If model has a "/" in it, it's an OpenRouter model regardless of stored provider
      const actualProvider = modelId.includes("/") ? "openrouter" : selectedModelData.provider;
      
      setSelectedModel({
        model: modelId,
        provider: actualProvider,
      });
    }
    setIsOpen(false);
    setSearchQuery("");
  }, [availableModels, setSelectedModel]);

  const toggleShowAll = useCallback(() => {
    setShowAllModels(!showAllModels);
  }, [showAllModels]);

  const handleSearchChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setSearchQuery(e.target.value);
    },
    []
  );

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
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-auto gap-2 rounded-full border-secondary-foreground/10 py-1.5 pl-2 pr-2.5 text-muted-foreground max-sm:p-2"
        >
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 [&_svg]:w-full [&_svg]:h-full">
              {selectedModelData?.icon}
            </div>
            <span>{selectedModelData?.name}</span>
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
                    isSelected={selectedModel.model === model.id}
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
                        isSelected={selectedModel.model === model.id}
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
}
