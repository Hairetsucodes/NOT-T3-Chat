"use client";

import { useState } from "react";
import { Search, ChevronDown, Pin, ChevronUp, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { models } from "@/data/models";
import { ModelCard } from "./ModelCard";
import { ModelListItem } from "./ModelListItem";

export default function ModelSelector() {
  const [selectedModel, setSelectedModel] = useState("gemini-2.5-flash");
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [showAllModels, setShowAllModels] = useState(false);

  const favoriteModels = models.filter((model) => model.isFavorite);
  const otherModels = models.filter((model) => !model.isFavorite);
  const selectedModelData = models.find((model) => model.id === selectedModel);

  // Filter models based on search and show all toggle
  const modelsToShow = showAllModels ? models : favoriteModels;
  const filteredModels = modelsToShow.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // For cards view, separate favorites and others
  const filteredFavorites = favoriteModels.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );
  const filteredOthers = otherModels.filter((model) =>
    model.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleModelSelect = (modelId: string) => {
    setSelectedModel(modelId);
    setIsOpen(false);
    setSearchQuery("");
  };

  const toggleShowAll = () => {
    setShowAllModels(!showAllModels);
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="text-xs h-auto gap-2 rounded-full border-secondary-foreground/10 py-1.5 pl-2 pr-2.5 text-muted-foreground max-sm:p-2"
        >
          <div className="flex items-center gap-2 text-sm">
            <div className="w-4 h-4 [&_svg]:w-full [&_svg]:h-full">{selectedModelData?.icon}</div>
            <span>{selectedModelData?.name}</span>
          </div>
          <ChevronDown className="w-4 h-4" />
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className={`w-auto ${
          showAllModels ? "sm:w-[640px]" : "sm:w-[420px]"
        } max-h-[80vh] p-0 overflow-hidden`}
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
                    isSelected={selectedModel === model.id}
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
                        isSelected={selectedModel === model.id}
                        onSelect={handleModelSelect}
                      />
                    ))}
                  </>
                )}
              </div>
            ) : (
              /* List View - Favorites Only */
              <div className="max-h-full overflow-y-scroll px-1.5 scroll-shadow">
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
