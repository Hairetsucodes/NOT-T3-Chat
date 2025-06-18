"use client";

import { useContext, useState } from "react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatContext } from "@/context/ChatContext";
import { addPreferredModel, removePreferredModel } from "@/data/models";
import { Search, Loader2, ImageIcon, Globe } from "lucide-react";
import { getProviderIcon } from "@/components/ui/provider-images";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { imageCapableModels } from "@/constants/imageModels";
import { ModelFilter } from "./ModelFilter";
import { getCapabilities } from "./helpers/modelCapability";

export default function Models() {
  const {
    availableModels,
    filteredModels,
    refreshPreferredModels,
    preferredModels,
    setPreferredModels,
    activeProviders,  
  } = useContext(ChatContext);
  const [displayedCount, setDisplayedCount] = useState(50);
  const [loading, setLoading] = useState(false);

  const displayedModels = filteredModels.slice(0, displayedCount);
  const hasMore = displayedCount < filteredModels.length;

  const loadMore = () => {
    setLoading(true);
    setTimeout(() => {
      setDisplayedCount((prev) => prev + 10);
      setLoading(false);
    }, 300);
  };

  const toggleModel = async (modelId: string) => {
    const isCurrentlyEnabled = preferredModels.some((m) => m.model === modelId);
    const model = availableModels?.find((m) => m.modelId === modelId);

    if (!model) {
      console.error("Model not found");
      return;
    }

    // Optimistic update - immediately update UI
    if (isCurrentlyEnabled) {
      // Remove from preferences optimistically
      setPreferredModels(preferredModels.filter((m) => m.model !== modelId));
    } else {
      // Add to preferences optimistically
      const newPreferredModel = {
        id: `temp-${modelId}`, // Temporary ID
        userId: "", // Will be set by server
        model: modelId,
        provider: model.provider,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setPreferredModels([...preferredModels, newPreferredModel]);
    }

    // Then update database in background
    try {
      if (isCurrentlyEnabled) {
        // Remove from preferences
        const result = await removePreferredModel(modelId);
        if (result && "error" in result) {
          console.error("Failed to remove preferred model:", result);
          // Revert optimistic update on error
          await refreshPreferredModels();
        }
      } else {
        // Add to preferences
        const result = await addPreferredModel(modelId, model.provider);
        if (result && "error" in result) {
          console.error("Failed to add preferred model:", result);
          // Revert optimistic update on error
          await refreshPreferredModels();
        }
      }
    } catch (error) {
      console.error("Error toggling model preference:", error);
      // Revert optimistic update on error
      await refreshPreferredModels();
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
            No models available. Make sure you have API keys configured for your
            providers.
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
        <ModelFilter
          setDisplayedCount={setDisplayedCount}
          displayedCount={displayedCount}
          filteredCount={filteredModels.length}
        />

        <ScrollArea className="flex-1">
          <div className="space-y-4">
            {displayedModels.map((model) => {
              const capabilities = getCapabilities(
                model.name,
                model.description
              );

              const isEnabled = preferredModels.some(
                (m) => m.model === model.modelId
              );

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

                      {(capabilities.length > 0 ||
                        (model.provider === "openai" &&
                          imageCapableModels.includes(model.modelId))) && (
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
                          {model.provider === "openai" &&
                            imageCapableModels.includes(
                              model.modelId.toLowerCase()
                            ) && (
                              <div>
                                <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs text-yellow-600 dark:text-yellow-400">
                                  <ImageIcon className="h-3 w-3" />
                                  Image Generation
                                </div>
                                <div className="flex items-center gap-1 rounded-full bg-yellow-500/10 px-2 py-1 text-xs text-yellow-600 dark:text-yellow-400">
                                  <Globe className="h-3 w-3" />
                                  Web Search
                                </div>
                              </div>
                            )}
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
            {activeProviders.length === 0 && (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <p className="mt-2 text-sm text-muted-foreground">
                  No active providers found. Please add an API key.
                </p>
              </div>
            )}
            {filteredModels.length === 0 && activeProviders.length > 0 && (
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
