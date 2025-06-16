import { Brain, Eye, FileText, Globe, Zap } from "lucide-react";
// Capability mapping
export const getCapabilities = (
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
