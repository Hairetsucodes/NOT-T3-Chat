"use client";

import { useContext, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatContext } from "@/context/ChatContext";
import { useSession } from "next-auth/react";
import { addPreferredModel, removePreferredModel } from "@/data/models";
import {
  Search,
  Filter,
  Sparkles,
  Eye,
  Globe,
  FileText,
  Brain,
  Key,
  Gem,
  FlaskConical,
  Zap,
  ChevronDown,
  Loader2,
} from "lucide-react";
import {
  getProviderIcon,
  GeminiIcon,
  OpenAIIcon,
  AnthropicIcon,
  GrokIcon,
  DeepSeekIcon,
  OpenRouterIcon,
} from "@/components/ui/provider-images";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Capability mapping
const getCapabilities = (
  modelName: string,
  description: string | null | undefined
) => {
  const capabilities = [];
  const desc = description?.toLowerCase() || "";
  const name = modelName.toLowerCase();

  if (
    desc.includes("vision") ||
    desc.includes("image") ||
    desc.includes("multimodal")
  ) {
    capabilities.push({ icon: Eye, label: "Vision" });
  }

  if (
    desc.includes("reasoning") ||
    desc.includes("thinking") ||
    name.includes("reasoning")
  ) {
    capabilities.push({ icon: Brain, label: "Reasoning" });
  }

  if (
    desc.includes("search") ||
    desc.includes("web") ||
    desc.includes("browse")
  ) {
    capabilities.push({ icon: Globe, label: "Web Search" });
  }

  if (desc.includes("code") || desc.includes("programming")) {
    capabilities.push({ icon: FileText, label: "Code" });
  }

  if (
    desc.includes("fast") ||
    desc.includes("speed") ||
    name.includes("flash")
  ) {
    capabilities.push({ icon: Zap, label: "Fast" });
  }

  return capabilities;
};

// Model type detection
const getModelType = (modelName: string, pricing: string | null) => {
  const types = [];

  // Check if experimental
  if (
    modelName.toLowerCase().includes("exp") ||
    modelName.toLowerCase().includes("preview") ||
    modelName.toLowerCase().includes("beta") ||
    modelName.toLowerCase().includes("scout") ||
    modelName.toLowerCase().includes("maverick")
  ) {
    types.push({ icon: FlaskConical, label: "Experimental Model" });
  }

  // Check if premium/pro
  if (
    modelName.toLowerCase().includes("pro") ||
    modelName.toLowerCase().includes("plus") ||
    modelName.includes("opus")
  ) {
    types.push({ icon: Gem, label: "Premium Model" });
  }

  // Check if requires API key (high pricing indicates direct API access)
  if (pricing) {
    try {
      const pricingData = JSON.parse(pricing);
      if (pricingData.prompt > 0.00001) {
        types.push({ icon: Key, label: "Premium Pricing" });
      }
    } catch {
      // Ignore parsing errors
    }
  }

  return types;
};

type FilterType =
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
  | "deepseek";

export default function Models() {
  const { availableModels } = useContext(ChatContext);
  const { data: session } = useSession();
  const [searchTerm, setSearchTerm] = useState("");
  const [showNotification, setShowNotification] = useState(true);
  const [enabledModels, setEnabledModels] = useState(new Set<string>());
  const [selectedFilters, setSelectedFilters] = useState<FilterType[]>(["all"]);
  const [displayedCount, setDisplayedCount] = useState(50);
  const [loading, setLoading] = useState(false);

  const filteredModels = useMemo(() => {
    if (!availableModels) return [];

    const filtered = availableModels.filter((model) => {
      const matchesSearch =
        model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        model.provider.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchesSearch) return false;

      if (selectedFilters.includes("all")) return true;

      const capabilities = getCapabilities(model.name, model.description);
      const types = getModelType(
        model.name,
        typeof model.pricing === "string" ? model.pricing : null
      );

      return selectedFilters.some((filter) => {
        switch (filter) {
          case "vision":
            return capabilities.some((cap) => cap.label === "Vision");
          case "reasoning":
            return capabilities.some((cap) => cap.label === "Reasoning");
          case "code":
            return capabilities.some((cap) => cap.label === "Code");
          case "fast":
            return capabilities.some((cap) => cap.label === "Fast");
          case "experimental":
            return types.some((type) => type.label === "Experimental Model");
          case "premium":
            return types.some(
              (type) =>
                type.label === "Premium Model" ||
                type.label === "Premium Pricing"
            );
          case "direct":
            return model.direct === true;
          case "openrouter":
            return model.direct === false;
          case "google":
            return model.provider.toLowerCase() === "google";
          case "openai":
            return model.provider.toLowerCase() === "openai";
          case "anthropic":
            return model.provider.toLowerCase() === "anthropic";
          case "xai":
            return model.provider.toLowerCase() === "xai";
          case "deepseek":
            return model.provider.toLowerCase() === "deepseek";
          default:
            return false;
        }
      });
    });

    return filtered;
  }, [availableModels, searchTerm, selectedFilters]);

  const displayedModels = filteredModels.slice(0, displayedCount);
  const hasMore = displayedCount < filteredModels.length;

  // Calculate provider counts for the notification banner
  const providerCounts = useMemo(() => {
    if (!availableModels) return {};

    const counts: Record<string, number> = {};
    availableModels.forEach((model) => {
      // Group OpenRouter models together, keep direct API models separate
      const provider = model.direct ? model.provider : "openrouter";
      counts[provider] = (counts[provider] || 0) + 1;
    });

    return counts;
  }, [availableModels]);

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setDisplayedCount((prev) => prev + 10);
      setLoading(false);
    }, 300);
  };

  const toggleFilter = (filter: FilterType) => {
    if (filter === "all") {
      setSelectedFilters(["all"]);
    } else {
      setSelectedFilters((prev) => {
        const newFilters = prev.filter((f) => f !== "all");
        if (newFilters.includes(filter)) {
          const updated = newFilters.filter((f) => f !== filter);
          return updated.length === 0 ? ["all"] : updated;
        } else {
          return [...newFilters, filter];
        }
      });
    }
    setDisplayedCount(50); // Reset pagination when filters change
  };

  const toggleModel = async (modelId: string) => {
    if (!session?.user?.id) {
      console.error("User not authenticated");
      return;
    }

    const isCurrentlyEnabled = enabledModels.has(modelId);
    const model = availableModels?.find((m) => m.modelId === modelId);

    if (!model) {
      console.error("Model not found");
      return;
    }

    // Optimistic update - update UI immediately
    setEnabledModels((prev) => {
      const newSet = new Set(prev);
      if (isCurrentlyEnabled) {
        newSet.delete(modelId);
      } else {
        newSet.add(modelId);
      }
      return newSet;
    });

    // Then update database in background
    try {
      if (isCurrentlyEnabled) {
        // Remove from preferences
        const result = await removePreferredModel(session.user.id, modelId);
        if (result && "error" in result) {
          console.error("Failed to remove preferred model:", result);
          // Revert optimistic update on error
          setEnabledModels((prev) => {
            const newSet = new Set(prev);
            newSet.add(modelId);
            return newSet;
          });
        }
      } else {
        // Add to preferences
        const result = await addPreferredModel(
          session.user.id,
          modelId,
          model.provider
        );
        if (result && "error" in result) {
          console.error("Failed to add preferred model:", result);
          // Revert optimistic update on error
          setEnabledModels((prev) => {
            const newSet = new Set(prev);
            newSet.delete(modelId);
            return newSet;
          });
        }
      }
    } catch (error) {
      console.error("Error toggling model preference:", error);
      // Revert optimistic update on error
      setEnabledModels((prev) => {
        const newSet = new Set(prev);
        if (isCurrentlyEnabled) {
          newSet.add(modelId);
        } else {
          newSet.delete(modelId);
        }
        return newSet;
      });
    }
  };

  const formatContextLength = (length: number) => {
    if (length >= 1000000) {
      return `${(length / 1000000).toFixed(1)}M`;
    } else if (length >= 1000) {
      return `${(length / 1000).toFixed(0)}K`;
    }
    return length.toString();
  };

  if (!availableModels || availableModels.length === 0) {
    return (
      <div className="flex h-full flex-col space-y-6">
        <div>
          <h2 className="text-xl font-bold sm:text-2xl">Models</h2>
          <p className="mt-2 text-sm text-muted-foreground/80 sm:text-base">
            No models available. Make sure you have OpenRouter configured in
            your API keys.
          </p>
        </div>
      </div>
    );
  }

  return (
    <Card className="relative z-10 h-full flex flex-col bg-gradient-chat-overlay border-chat-border/50 backdrop-blur-sm">
      <CardHeader className="flex-shrink-0 pb-2">
        <CardTitle className="text-foreground/90 text-xl">Models</CardTitle>
        <CardDescription className="text-foreground/70">
          Choose which models appear in your model selector. This won&apos;t
          affect existing conversations.
        </CardDescription>
      </CardHeader>
      <CardContent className="">
        {showNotification && (
          <div className="flex items-center justify-between rounded-lg border border-pink-500/20 bg-pink-500/10 p-4 my-2">
            <div className="flex items-center gap-2">
              <Sparkles className="hidden h-5 w-5 text-[#ffb525f7] drop-shadow-[0px_3px_8px_#ffae1082] sm:block dark:text-amber-200/80 dark:drop-shadow-[0px_3px_8px_rgba(186,130,21,0.62)]" />
              <div>
                <h3 className="font-medium text-muted-foreground">
                  Models loaded!
                </h3>
                <p className="text-start text-sm text-muted-foreground">
                  {availableModels.length} models loaded
                  {Object.keys(providerCounts).length > 0 && (
                    <>
                      {" "}
                      (
                      {Object.entries(providerCounts)
                        .sort(([, a], [, b]) => b - a) // Sort by count descending
                        .map(([provider, count], index, array) => (
                          <span key={provider}>
                            {count} {provider}
                            {index < array.length - 1 && ", "}
                          </span>
                        ))}
                      )
                    </>
                  )}
                  !
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                className="border-pink-500/30 bg-pink-500/10 text-pink-400 hover:bg-pink-500/20"
                onClick={() => setShowNotification(false)}
              >
                Got it
              </Button>
            </div>
          </div>
        )}

        <div className="w-full flex flex-col md:flex-row items-baseline justify-between gap-3 sm:items-center sm:gap-2 my-2">
          <div className="flex flex-wrap items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="whitespace-nowrap">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter features/providers
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56">
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("all")}
                  onCheckedChange={() => toggleFilter("all")}
                >
                  All Models
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("vision")}
                  onCheckedChange={() => toggleFilter("vision")}
                >
                  <Eye className="mr-2 h-4 w-4" />
                  Vision
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("reasoning")}
                  onCheckedChange={() => toggleFilter("reasoning")}
                >
                  <Brain className="mr-2 h-4 w-4" />
                  Reasoning
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("code")}
                  onCheckedChange={() => toggleFilter("code")}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  Code
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("fast")}
                  onCheckedChange={() => toggleFilter("fast")}
                >
                  <Zap className="mr-2 h-4 w-4" />
                  Fast
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("experimental")}
                  onCheckedChange={() => toggleFilter("experimental")}
                >
                  <FlaskConical className="mr-2 h-4 w-4" />
                  Experimental
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("premium")}
                  onCheckedChange={() => toggleFilter("premium")}
                >
                  <Gem className="mr-2 h-4 w-4" />
                  Premium
                </DropdownMenuCheckboxItem>
                <div className="border-t my-1" />
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("direct")}
                  onCheckedChange={() => toggleFilter("direct")}
                >
                  <Key className="mr-2 h-4 w-4" />
                  Direct API
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("openrouter")}
                  onCheckedChange={() => toggleFilter("openrouter")}
                >
                  <OpenRouterIcon className="mr-2 h-4 w-4" />
                  OpenRouter
                </DropdownMenuCheckboxItem>
                <div className="border-t my-1" />
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("openai")}
                  onCheckedChange={() => toggleFilter("openai")}
                >
                  <div className="mr-2 h-4 w-4">
                    <OpenAIIcon className="h-4 w-4" />
                  </div>
                  OpenAI
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("google")}
                  onCheckedChange={() => toggleFilter("google")}
                >
                  <div className="mr-2 h-4 w-4">
                    <GeminiIcon className="h-4 w-4" />
                  </div>
                  Google
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("anthropic")}
                  onCheckedChange={() => toggleFilter("anthropic")}
                >
                  <div className="mr-2 h-4 w-4">
                    <AnthropicIcon className="h-4 w-4" />
                  </div>
                  Anthropic
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("xai")}
                  onCheckedChange={() => toggleFilter("xai")}
                >
                  <div className="mr-2 h-4 w-4">
                    <GrokIcon className="h-4 w-4" />
                  </div>
                  xAI
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={selectedFilters.includes("deepseek")}
                  onCheckedChange={() => toggleFilter("deepseek")}
                >
                  <div className="mr-2 h-4 w-4">
                    <DeepSeekIcon className="h-4 w-4" />
                  </div>
                  DeepSeek
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="flex items-center gap-2">
            <div className="text-sm text-muted-foreground">
              Showing {displayedModels.length} of {filteredModels.length} models
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search models..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setDisplayedCount(50); // Reset pagination when searching
                }}
                className="pl-10 w-64"
              />
            </div>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {displayedModels.map((model) => {
              const capabilities = getCapabilities(
                model.name,
                model.description
              );
              const modelTypes = getModelType(
                model.name,
                typeof model.pricing === "string" ? model.pricing : null
              );
              const isEnabled = enabledModels.has(model.modelId);

              return (
                <div
                  key={model.modelId}
                  className={`rounded-lg border p-4 transition-all duration-200 ${
                    isEnabled
                      ? "border-primary/40 bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/20 hover:bg-muted/20"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 shrink-0 rounded-md">
                          {getProviderIcon(model.provider, "h-8 w-8")}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium leading-none">
                              {model.name}
                            </h3>
                            <div
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                                model.direct
                                  ? "bg-green-500/10 text-green-600 dark:text-green-400"
                                  : "bg-purple-500/10 text-purple-600 dark:text-purple-400"
                              }`}
                            >
                              <div
                                className={`h-1.5 w-1.5 rounded-full ${
                                  model.direct
                                    ? "bg-green-500"
                                    : "bg-purple-500"
                                }`}
                              />
                              {model.direct ? "Direct API" : "OpenRouter"}
                            </div>
                          </div>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {model.provider} •{" "}
                            {formatContextLength(model.contextLength || 0)}{" "}
                            context
                          </p>
                        </div>
                      </div>

                      {(capabilities.length > 0 || modelTypes.length > 0) && (
                        <div className="flex flex-wrap gap-2">
                          {capabilities.map((capability, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 rounded-full bg-blue-500/10 px-2 py-1 text-xs text-blue-600 dark:text-blue-400"
                            >
                              <capability.icon className="h-3 w-3" />
                              {capability.label}
                            </div>
                          ))}
                          {modelTypes.map((type, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs text-amber-600 dark:text-amber-400"
                            >
                              <type.icon className="h-3 w-3" />
                              {type.label}
                            </div>
                          ))}
                        </div>
                      )}

                      {model.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {model.description}
                        </p>
                      )}
                    </div>

                    <div className="ml-4 flex shrink-0 items-center">
                      <Switch
                        checked={isEnabled}
                        onCheckedChange={() => toggleModel(model.modelId)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}

            {hasMore && (
              <div className="flex justify-center pt-4">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loading}
                  className="min-w-32"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    `Load More (${
                      filteredModels.length - displayedCount
                    } remaining)`
                  )}
                </Button>
              </div>
            )}

            {filteredModels.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Search className="h-12 w-12 text-muted-foreground/40" />
                <h3 className="mt-4 text-lg font-medium">No models found</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
