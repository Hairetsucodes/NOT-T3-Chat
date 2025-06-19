import { Brain, FileText, Globe, Zap } from "lucide-react";
import { imageCapableModels } from "@/constants/imageModels";
import { UnifiedModel } from "@/types/models";
import { FilterType } from "@/types/models";

// Capability mapping
export const getCapabilities = (
  provider: string,
  modelName: string,
  description: string | null | undefined
) => {
  const capabilities = [];
  const desc = description?.toLowerCase() || "";
  const name = modelName.toLowerCase();

  if (
    desc.includes("reasoning") ||
    desc.includes("thinking") ||
    name.includes("reasoning")
  ) {
    capabilities.push({ icon: <Brain className="h-4 w-4" />, label: "Reasoning" });
  }

  // Google Gemini and OpenAI GPT 4.1 specific grounding capability
  if (
    (provider.toLowerCase() === "google" &&
      (name.includes("gemini 2.5") ||
        (name.includes("gemini 2.0 flash") &&
          !name.includes("lite") &&
          !name.includes("image")))) ||
    (provider.toLowerCase() === "openai" &&
      name.includes("gpt 4.1") &&
      !name.includes("nano"))
  ) {
    capabilities.push({ icon: <Globe className="h-4 w-4" />, label: "WebSearch / Grounding" });
  } else if (
    desc.includes("search") ||
    desc.includes("web") ||
    desc.includes("browse")
  ) {
    capabilities.push({ icon: <Globe className="h-4 w-4" />, label: "Web Search" });
  }

  if (desc.includes("code") || desc.includes("programming")) {
    capabilities.push({ icon: <FileText className="h-4 w-4" />, label: "Code" });
  }

  if (
    desc.includes("fast") ||
    desc.includes("speed") ||
    name.includes("flash")
  ) {
    capabilities.push({ icon: <Zap className="h-4 w-4" />, label: "Fast" });
  }

  return capabilities;
};

export const modelMatchesFilter = (
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
      return description.includes("web search") || name.includes("web search");
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
