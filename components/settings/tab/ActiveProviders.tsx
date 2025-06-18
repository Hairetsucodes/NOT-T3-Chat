"use client";

import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getProviderIcon } from "@/components/ui/provider-images";

interface Model {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ActiveProvidersProps {
  apiKeys: {
    id: string;
    provider: string;
  }[];
  customModels: Model[];
  ollamaModels: Model[];
  localModels: Model[];
  onDeleteApiKey?: (keyId: string) => void;
}

// Provider color mapping
const getProviderColors = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "google":
      return {
        bg: "bg-blue-50/80 dark:bg-blue-950/30",
        border: "border-blue-200/60 dark:border-blue-800/40",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400",
        glow: "shadow-blue-500/20 dark:shadow-blue-400/20",
      };
    case "openai":
      return {
        bg: "bg-green-50/80 dark:bg-green-950/30",
        border: "border-green-200/60 dark:border-green-800/40",
        text: "text-green-700 dark:text-green-300",
        icon: "text-green-600 dark:text-green-400",
        glow: "shadow-green-500/20 dark:shadow-green-400/20",
      };
    case "anthropic":
      return {
        bg: "bg-orange-50/80 dark:bg-orange-950/30",
        border: "border-orange-200/60 dark:border-orange-800/40",
        text: "text-orange-700 dark:text-orange-300",
        icon: "text-orange-600 dark:text-orange-400",
        glow: "shadow-orange-500/20 dark:shadow-orange-400/20",
      };
    case "xai":
      return {
        bg: "bg-gray-50/80 dark:bg-gray-950/30",
        border: "border-gray-200/60 dark:border-gray-800/40",
        text: "text-gray-700 dark:text-gray-300",
        icon: "text-gray-600 dark:text-gray-400",
        glow: "shadow-gray-500/20 dark:shadow-gray-400/20",
      };
    case "deepseek":
      return {
        bg: "bg-indigo-50/80 dark:bg-indigo-950/30",
        border: "border-indigo-200/60 dark:border-indigo-800/40",
        text: "text-indigo-700 dark:text-indigo-300",
        icon: "text-indigo-600 dark:text-indigo-400",
        glow: "shadow-indigo-500/20 dark:shadow-indigo-400/20",
      };
    case "openrouter":
      return {
        bg: "bg-purple-50/80 dark:bg-purple-950/30",
        border: "border-purple-200/60 dark:border-purple-800/40",
        text: "text-purple-700 dark:text-purple-300",
        icon: "text-purple-600 dark:text-purple-400",
        glow: "shadow-purple-500/20 dark:shadow-purple-400/20",
      };
    case "meta":
    case "llama":
      return {
        bg: "bg-blue-50/80 dark:bg-blue-950/30",
        border: "border-blue-200/60 dark:border-blue-800/40",
        text: "text-blue-700 dark:text-blue-300",
        icon: "text-blue-600 dark:text-blue-400",
        glow: "shadow-blue-500/20 dark:shadow-blue-400/20",
      };
    case "ollama":
      return {
        bg: "bg-emerald-50/80 dark:bg-emerald-950/30",
        border: "border-emerald-200/60 dark:border-emerald-800/40",
        text: "text-emerald-700 dark:text-emerald-300",
        icon: "text-emerald-600 dark:text-emerald-400",
        glow: "shadow-emerald-500/20 dark:shadow-emerald-400/20",
      };
    case "custom":
      return {
        bg: "bg-violet-50/80 dark:bg-violet-950/30",
        border: "border-violet-200/60 dark:border-violet-800/40",
        text: "text-violet-700 dark:text-violet-300",
        icon: "text-violet-600 dark:text-violet-400",
        glow: "shadow-violet-500/20 dark:shadow-violet-400/20",
      };
    case "local":
      return {
        bg: "bg-amber-50/80 dark:bg-amber-950/30",
        border: "border-amber-200/60 dark:border-amber-800/40",
        text: "text-amber-700 dark:text-amber-300",
        icon: "text-amber-600 dark:text-amber-400",
        glow: "shadow-amber-500/20 dark:shadow-amber-400/20",
      };
    default:
      return {
        bg: "bg-slate-50/80 dark:bg-slate-950/30",
        border: "border-slate-200/60 dark:border-slate-800/40",
        text: "text-slate-700 dark:text-slate-300",
        icon: "text-slate-600 dark:text-slate-400",
        glow: "shadow-slate-500/20 dark:shadow-slate-400/20",
      };
  }
};

export default function ActiveProviders({
  apiKeys,
  customModels,
  ollamaModels,
  localModels,
  onDeleteApiKey,
}: ActiveProvidersProps) {
  const hasActiveProviders =
    apiKeys.length > 0 ||
    customModels.length > 0 ||
    ollamaModels.length > 0 ||
    localModels.length > 0;

  return (
    <div className="mt-4 rounded-[6px] p-4 bg-gradient-to-br from-secondary/50 via-secondary/30 to-background border">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
        <h3 className="text-sm font-medium">Active Providers</h3>
      </div>

      {hasActiveProviders ? (
        <div className="flex flex-wrap gap-3">
          {/* API Keys */}
          {apiKeys.map((apiKey) => (
            <ProviderBadge
              key={apiKey.id}
              provider={apiKey.provider}
              icon={getProviderIcon(apiKey.provider, "h-6 w-6 flex-shrink-0")}
              name={
                apiKey.provider.charAt(0).toUpperCase() +
                apiKey.provider.slice(1)
              }
              onDelete={
                onDeleteApiKey ? () => onDeleteApiKey(apiKey.id) : undefined
              }
            />
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">
          No active providers configured
        </div>
      )}
    </div>
  );
}

interface ProviderBadgeProps {
  provider: string;
  icon: React.ReactNode;
  name: string;
  onDelete?: () => void;
}

function ProviderBadge({ provider, icon, name, onDelete }: ProviderBadgeProps) {
  const colors = getProviderColors(provider);

  return (
    <div
      className={`
      inline-flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm font-medium
      ${colors.bg} ${colors.border} border backdrop-blur-sm
      transition-all duration-300 ease-out
      hover:scale-105 hover:shadow-lg hover:${colors.glow}
      active:scale-95
      group cursor-default
    `}
    >
      <div
        className={`${colors.icon} flex items-center justify-center transition-transform duration-200 group-hover:scale-110`}
      >
        {icon}
      </div>
      <span
        className={`${colors.text} font-medium tracking-wide whitespace-nowrap`}
      >
        {name}
      </span>
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className={`
            ml-1 h-5 w-5 p-0 rounded-full
            opacity-0 group-hover:opacity-100 
            transition-all duration-200 ease-out
            hover:bg-destructive/15 hover:text-destructive
            hover:scale-110 active:scale-95
            border-0 shadow-none
          `}
        >
          <Trash2Icon className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}
