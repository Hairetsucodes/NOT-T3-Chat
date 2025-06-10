"use client";

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ApiKey {
  id: string;
  key: string;
  provider: string;
}

interface Model {
  id: string;
  name: string;
  [key: string]: unknown;
}

interface ActiveProvidersProps {
  apiKeys: ApiKey[];
  customModels: Model[];
  ollamaModels: Model[];
  localModels: Model[];
  providerIcons: Record<string, React.ReactNode>;
  onDeleteApiKey?: (keyId: string) => void;
}

export default function ActiveProviders({
  apiKeys,
  customModels,
  ollamaModels,
  localModels,
  providerIcons,
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
        <div className="flex flex-wrap gap-2">
          {/* API Keys */}
          {apiKeys.map((apiKey) => (
            <ProviderBadge
              key={apiKey.id}
              icon={providerIcons[apiKey.provider as keyof typeof providerIcons]}
              name={apiKey.provider.charAt(0).toUpperCase() + apiKey.provider.slice(1)}
              onDelete={onDeleteApiKey ? () => onDeleteApiKey(apiKey.id) : undefined}
            />
          ))}
          
          {/* Custom Models */}
          {customModels.length > 0 && (
            <ProviderBadge
              icon={providerIcons["custom" as keyof typeof providerIcons]}
              name="Custom"
            />
          )}
          
          {/* Ollama Models */}
          {ollamaModels.length > 0 && (
            <ProviderBadge
              icon={providerIcons["ollama" as keyof typeof providerIcons]}
              name="Ollama"
            />
          )}
          
          {/* Local Models */}
          {localModels.length > 0 && (
            <ProviderBadge
              icon={providerIcons["local" as keyof typeof providerIcons]}
              name="Local"
            />
          )}
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
  icon: React.ReactNode;
  name: string;
  onDelete?: () => void;
}

function ProviderBadge({ icon, name, onDelete }: ProviderBadgeProps) {
  return (
    <div className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-background/80 backdrop-blur-sm border shadow-sm hover:shadow-md transition-shadow group">
      {icon}
      <span className="ml-1.5">{name}</span>
      {onDelete && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onDelete}
          className="ml-1 h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-destructive/20 hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
} 