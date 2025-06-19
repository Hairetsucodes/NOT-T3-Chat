import { Brain, FileText, Globe, Zap } from "lucide-react";
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
    capabilities.push({ icon: Brain, label: "Reasoning" });
  }

  // Google Gemini and OpenAI GPT 4.1 specific grounding capability
  if (
    (provider.toLowerCase() === "google" && 
     (name.includes("gemini 2.5") || 
      (name.includes("gemini 2.0 flash") && !name.includes("lite") && !name.includes("image")))) ||
    (provider.toLowerCase() === "openai" && name.includes("gpt 4.1") && !name.includes("nano"))
  ) {
    capabilities.push({ icon: Globe, label: "WebSearch / Grounding" });
  } else if (
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
