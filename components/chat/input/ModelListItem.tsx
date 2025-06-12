import { getProviderIcon } from "@/components/ui/provider-images";
import { memo, useCallback } from "react";

interface Capability {
  label: string;
  icon: React.ReactNode;
}

interface AIModel {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  capabilities: Capability[];
  provider: string;
  isPro: boolean;
  isDisabled: boolean;
  isFavorite: boolean;
  isExperimental?: boolean;
  requiresKey?: boolean;
}

interface ModelListItemProps {
  model: AIModel;
  onSelect: (modelId: string) => void;
}

export const ModelListItem = memo(function ModelListItem({
  model,
  onSelect,
}: ModelListItemProps) {
  const isDisabled = model.isDisabled;

  const handleSelect = useCallback(() => {
    if (!isDisabled) {
      onSelect(model.id);
    }
  }, [isDisabled, onSelect, model.id]);

  return (
    <div
      role="menuitem"
      className={`relative select-none rounded-sm text-sm outline-none transition-colors focus:bg-accent/30 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 group flex flex-col items-start gap-1 px-3 py-3 ${
        isDisabled
          ? "cursor-not-allowed hover:!bg-transparent [&>*:not(.preserve-hover)]:opacity-50"
          : "cursor-default"
      }`}
      tabIndex={-1}
      onClick={handleSelect}
    >
      <div className="flex w-full items-center justify-between">
        <div
          className={`flex items-center gap-2 pr-2 font-medium text-muted-foreground transition-colors ${
            isDisabled ? "opacity-50" : ""
          }`}
        >
          <div className="flex items-center gap-2">
            {getProviderIcon(model.provider, "h-8 w-8 bg-transparent")}
          </div>
          <span className="w-fit text-sm">{model.name}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {model.capabilities.map((capability: Capability, index: number) => (
            <div
              key={index}
              className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md text-[--color] dark:text-[--color-dark]"
              style={
                {
                  "--color-dark": getCapabilityColor(capability.label).dark,
                  "--color": getCapabilityColor(capability.label).light,
                } as React.CSSProperties
              }
            >
              <div className="absolute inset-0 bg-current opacity-20 dark:opacity-15"></div>
              <div className="relative flex items-center justify-center">
                {capability.icon}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

function getCapabilityColor(label: string) {
  const colors = {
    Vision: { light: "hsl(168 54% 52%)", dark: "hsl(168 54% 74%)" },
    "Web Access": { light: "hsl(208 56% 52%)", dark: "hsl(208 56% 74%)" },
    Files: { light: "hsl(237 55% 57%)", dark: "hsl(237 75% 77%)" },
    Reasoning: { light: "hsl(263 58% 53%)", dark: "hsl(263 58% 75%)" },
  };
  return (
    colors[label as keyof typeof colors] || {
      light: "hsl(210 40% 52%)",
      dark: "hsl(210 40% 74%)",
    }
  );
}
