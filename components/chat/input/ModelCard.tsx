import { FlaskConical, Gem, Key, Pin, PinOff } from "lucide-react";
import { useContext, useState, useCallback, memo } from "react";
import { ChatContext } from "@/context/ChatContext";
import { addPreferredModel, removePreferredModel } from "@/data/models";
import { toast } from "sonner";

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
  isNew?: boolean;
  specialStyling?: { border?: string; shadow?: string };
}

interface ModelCardProps {
  model: AIModel;
  onSelect: (modelId: string) => void;
}

// Helper function to get capability colors
function getCapabilityColor(label: string) {
  const colors = {
    Vision: { light: "hsl(168 54% 52%)", dark: "hsl(168 54% 74%)" },
    "Web Access": { light: "hsl(208 56% 52%)", dark: "hsl(208 56% 74%)" },
    Files: { light: "hsl(237 55% 57%)", dark: "hsl(237 75% 77%)" },
    Reasoning: { light: "hsl(263 58% 53%)", dark: "hsl(263 58% 75%)" },
    "Image Generation": { light: "hsl(12 60% 45%)", dark: "hsl(12 60% 60%)" },
  };
  return (
    colors[label as keyof typeof colors] || {
      light: "hsl(210 40% 52%)",
      dark: "hsl(210 40% 74%)",
    }
  );
}

export const ModelCard = memo(function ModelCard({
  model,
  onSelect,
}: ModelCardProps) {
  const { activeUser, refreshPreferredModels } = useContext(ChatContext);
  const [isToggling, setIsToggling] = useState(false);

  const isDisabled = model.isDisabled;
  const isExperimental = model.isExperimental;
  const isPremium = model.isPro;
  const isKeyRequired = model.requiresKey;
  const isNew = model.isNew;
  const specialStyling = model.specialStyling;
  const hasCapabilities = model.capabilities.length > 0;

  const handleToggleFavorite = useCallback(
    async (e: React.MouseEvent) => {
      e.stopPropagation(); // Prevent the model card from being selected

      if (!activeUser?.id) {
        toast.error("Please sign in to manage favorites");
        return;
      }

      if (isToggling) return; // Prevent double-clicks

      setIsToggling(true);

      try {
        if (model.isFavorite) {
          // Remove from favorites
          const result = await removePreferredModel(activeUser.id, model.id);
          if (result && "error" in result) {
            toast.error(result.error);
          } else {
            toast.success("Model removed from favorites");
            // Refresh the preferred models to update UI
            await refreshPreferredModels();
          }
        } else {
          // Add to favorites
          const result = await addPreferredModel(
            activeUser.id,
            model.id,
            model.provider
          );
          if (result && "error" in result) {
            toast.error(result.error);
          } else {
            toast.success("Model added to favorites");
            // Refresh the preferred models to update UI
            await refreshPreferredModels();
          }
        }
      } catch (error) {
        console.error("Error toggling favorite:", error);
        toast.error("Failed to update favorites");
      } finally {
        setIsToggling(false);
      }
    },
    [
      activeUser?.id,
      model.isFavorite,
      model.id,
      model.provider,
      isToggling,
      refreshPreferredModels,
    ]
  );

  const handleSelectModel = useCallback(() => {
    if (!isDisabled) {
      onSelect(model.id);
    }
  }, [isDisabled, onSelect, model.id]);

  // Build dynamic class names for special styling
  const cardClasses = [
    "group relative flex h-[148px] w-[108px] flex-col items-start gap-0.5 overflow-hidden rounded-xl border px-1 py-3 text-color-heading",
    "[--model-muted:hsl(var(--muted-foreground)/0.9)] [--model-primary:hsl(var(--color-heading))]",
    "hover:bg-accent/30 hover:text-color-heading",
    "dark:[--model-muted:hsl(var(--color-heading))] dark:[--model-primary:hsl(var(--muted-foreground)/0.9)] dark:hover:bg-accent/30",

    // Conditional classes
    isDisabled
      ? "cursor-not-allowed opacity-50 hover:!bg-transparent [&>*:not(.preserve-hover)]:opacity-50"
      : "cursor-pointer",

    // Special styling for certain models
    specialStyling?.border ||
      "border-chat-border/50 bg-sidebar/20 dark:border-chat-border dark:bg-[hsl(320,20%,2.9%)]",
  ];

  if (specialStyling?.shadow) {
    cardClasses.push(specialStyling.shadow);
  }

  return (
    <div className="group relative" data-state="closed">
      <div className="absolute -left-1.5 -top-1.5 z-10 rounded-full bg-popover p-0.5"></div>
      <button
        className={cardClasses.join(" ")}
        onClick={handleSelectModel}
        disabled={isDisabled}
      >
        {/* Main content area with flex layout to manage spacing */}
        <div className="flex flex-col items-center justify-start h-full w-full">
          {/* Top section: Icon and text */}
          <div
            className={`flex w-full flex-col items-center justify-center gap-1 font-medium transition-colors ${
              hasCapabilities ? "pb-8" : "flex-1"
            } ${isDisabled ? "opacity-50" : ""}`}
          >
            <div className="size-7 text-[--model-primary] flex items-center justify-center flex-shrink-0">
              {model.icon}
            </div>
            <div className="w-full text-center text-[--model-primary] min-h-0 flex-1">
              <div
                className="text-base font-semibold leading-tight truncate-2 px-1 text-sm"
                title={model.name}
              >
                {model.name.length > 25
                  ? model.name.slice(0, 25) + "..."
                  : model.name}
              </div>
            </div>

            {/* NEW badge for special models */}
            {isNew && (
              <div className="absolute right-[7px] top-1 text-[11px] text-[--model-muted]">
                NEW
              </div>
            )}

            {/* Top-right indicators */}
            {(isExperimental || isPremium || isKeyRequired) && (
              <div
                className={`absolute right-1.5 text-[--model-muted] opacity-80 ${
                  isNew ? "top-6" : "top-1.5"
                }`}
              >
                {isExperimental && <FlaskConical className="size-4" />}
                {isPremium && <Gem className="size-4" />}
                {isKeyRequired && <Key className="size-4" />}
              </div>
            )}
          </div>
        </div>

        {/* Bottom capabilities - absolutely positioned at bottom */}
        {hasCapabilities ? (
          <div
            className={`absolute inset-x-0 flex w-full items-center justify-center gap-2 ${
              model.capabilities.length > 3
                ? "bottom-1.5 flex-wrap gap-1 gap-x-1.5 px-4"
                : "bottom-3"
            }`}
          >
            {model.capabilities.map((capability: Capability, index: number) => {
              const colors = getCapabilityColor(capability.label);
              return (
                <div
                  key={index}
                  className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md text-[color:var(--color)] dark:text-[color:var(--color-dark)]"
                  data-state="closed"
                  title={capability.label}
                  style={
                    {
                      "--color": colors.light,
                      "--color-dark": colors.dark,
                    } as React.CSSProperties
                  }
                >
                  <div
                    className="absolute inset-0 opacity-20 dark:opacity-15"
                    style={{
                      backgroundColor: colors.light,
                    }}
                  ></div>
                  <div className="relative z-10">{capability.icon}</div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full flex items-center justify-center">
            <span className="text-xs text-primary">
              No capabilities
            </span>
          </div>
        )}
      </button>

      {/* Pin button on hover */}
      <div className="absolute -right-1.5 -top-1.5 left-auto z-50 flex w-auto translate-y-2 scale-95 items-center rounded-[10px] border border-chat-border/40 bg-card p-1 text-xs text-muted-foreground opacity-0 transition-all group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
        <button
          className="cursor-pointer rounded-md bg-accent/30 p-1.5 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
          tabIndex={-1}
          data-action="pin-thread"
          aria-label={model.isFavorite ? "Unpin model" : "Pin model"}
          onClick={handleToggleFavorite}
          disabled={isToggling}
        >
          {model.isFavorite ? (
            <PinOff className="size-4" />
          ) : (
            <Pin className="size-4" />
          )}
        </button>
      </div>
    </div>
  );
});
