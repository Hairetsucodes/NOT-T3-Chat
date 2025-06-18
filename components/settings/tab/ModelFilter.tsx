import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
  Filter,
  ChevronDown,
  ImageIcon,
  Eye,
  Brain,
  FileText,
  Zap,
  FlaskConical,
  Gem,
  Key,
  Search,
  Globe,
} from "lucide-react";
import {
  GeminiIcon,
  OpenAIIcon,
  AnthropicIcon,
  GrokIcon,
  DeepSeekIcon,
  OpenRouterIcon,
} from "@/components/ui/provider-images";
import { FilterType, UnifiedModel } from "@/types/models";
import { Input } from "@/components/ui/input";
import { useContext, useState, useEffect } from "react";
import { ChatContext } from "@/context/ChatContext";
import { imageCapableModels } from "@/constants/imageModels";

export function ModelFilter({
  setDisplayedCount,
  displayedCount,
  filteredCount,
}: {
  setDisplayedCount: (count: number) => void;
  displayedCount: number;
  filteredCount: number;
}) {
  const [selectedFilters, setSelectedFilters] = useState<FilterType[]>(["all"]);
  const [searchTerm, setSearchTerm] = useState("");
  const { availableModels, setFilteredModels, activeProviders } =
    useContext(ChatContext);

  const modelMatchesFilter = (
    model: UnifiedModel,
    filter: FilterType
  ): boolean => {
    const name = model.name.toLowerCase();
    const description = (model.description || "").toLowerCase();
    const provider = model.provider.toLowerCase();

    switch (filter) {
      case "all":
        return true;
      case "vision":
        return (
          description.includes("vision") ||
          description.includes("multimodal") ||
          name.includes("vision")
        );
      case "websearch":
        return (
          description.includes("web search") || name.includes("web search")
        );
      case "reasoning":
        return (
          description.includes("reasoning") ||
          description.includes("thinking") ||
          name.includes("reasoning") ||
          name.includes("o1") ||
          name.includes("r1")
        );
      case "code":
        return (
          description.includes("code") ||
          description.includes("programming") ||
          name.includes("code")
        );
      case "fast":
        return (
          description.includes("fast") ||
          description.includes("speed") ||
          name.includes("flash") ||
          name.includes("mini") ||
          name.includes("nano")
        );
      case "experimental":
        return (
          description.includes("experimental") ||
          description.includes("beta") ||
          name.includes("experimental") ||
          name.includes("beta")
        );
      case "premium":
        return (
          name.includes("pro") ||
          name.includes("plus") ||
          name.includes("opus") ||
          name.includes("sonnet")
        );
      case "image":
        return (
          (provider === "openai" &&
            imageCapableModels.includes(model.modelId.toLowerCase())) ||
          description.includes("image generation") ||
          description.includes("dall-e") ||
          name.includes("dall-e")
        );
      case "direct":
        return model.direct === true;
      case "openrouter":
        return model.direct === false;
      case "openai":
        return provider === "openai";
      case "google":
        return provider === "google";
      case "anthropic":
        return provider === "anthropic";
      case "xai":
        return provider === "xai";
      case "deepseek":
        return provider === "deepseek";
      default:
        return true;
    }
  };

  // Apply filters whenever selectedFilters, searchTerm, or availableModels change
  useEffect(() => {
    if (!availableModels) return;

    let filtered = availableModels.filter((model) =>
      activeProviders.some(
        (activeProvider) => activeProvider.provider === model.provider
      )
    );

    // Apply capability/feature filters
    if (!selectedFilters.includes("all")) {
      filtered = filtered.filter((model) =>
        selectedFilters.some((filter) => modelMatchesFilter(model, filter))
      );
    }

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (model) =>
          model.name.toLowerCase().includes(searchLower) ||
          model.modelId.toLowerCase().includes(searchLower) ||
          (model.description &&
            model.description.toLowerCase().includes(searchLower)) ||
          model.provider.toLowerCase().includes(searchLower)
      );
    }

    setFilteredModels(filtered);
  }, [
    selectedFilters,
    searchTerm,
    availableModels,
    activeProviders,
    setFilteredModels,
  ]);

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

  return (
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
              checked={selectedFilters.includes("image")}
              onCheckedChange={() => toggleFilter("image")}
            >
              <ImageIcon className="mr-2 h-4 w-4" />
              Image Generation
            </DropdownMenuCheckboxItem>
            <DropdownMenuCheckboxItem
              checked={selectedFilters.includes("websearch")}
              onCheckedChange={() => toggleFilter("websearch")}
            >
              <Globe className="mr-2 h-4 w-4" />
              Web Search
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
          Showing {Math.min(displayedCount, filteredCount)} of {filteredCount}{" "}
          models
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
  );
}
