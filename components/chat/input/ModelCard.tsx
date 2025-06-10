import type { AIModel } from "@/types/models";
import { FlaskConical, Gem, Key, Pin } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ModelCardProps {
  model: AIModel;
  isSelected: boolean;
  onSelect: (modelId: string) => void;
}

export function ModelCard({ model, isSelected, onSelect }: ModelCardProps) {
  const isDisabled = model.isDisabled;
  const isExperimental = model.isExperimental;
  const isPremium = model.isPro;
  const isKeyRequired = model.requiresKey;

  return (
    <div className="group relative">
      <div className="absolute -left-1.5 -top-1.5 z-10 rounded-full bg-popover p-0.5"></div>
      <button
        className={`group relative flex h-[148px] w-[108px] flex-col items-start gap-0.5 overflow-hidden rounded-xl border border-chat-border/50 bg-sidebar/20 px-1 py-3 text-color-heading [--model-muted:hsl(var(--muted-foreground)/0.9)] [--model-primary:hsl(var(--color-heading))] hover:bg-accent/30 hover:text-color-heading dark:border-chat-border dark:bg-[hsl(320,20%,2.9%)] dark:[--model-muted:hsl(var(--color-heading))] dark:[--model-primary:hsl(var(--muted-foreground)/0.9)] dark:hover:bg-accent/30 ${
          isDisabled
            ? "cursor-not-allowed opacity-50 hover:!bg-transparent [&>*:not(.preserve-hover)]:opacity-50"
            : "cursor-pointer"
        } ${isSelected ? "bg-accent border-primary" : ""}`}
        onClick={() => !isDisabled && onSelect(model.id)}
        disabled={isDisabled}
      >
        <div
          className={`flex w-full flex-col items-center justify-center gap-1 font-medium transition-colors ${
            isDisabled ? "opacity-50" : ""
          }`}
        >
          <div className="size-7 text-[--model-primary] flex items-center justify-center">
            {model.icon}
          </div>
          <div className="w-full text-center text-[--model-primary]">
            <div className="text-base font-semibold">{model.name}</div>
            {model.subtitle && (
              <div className="-mt-0.5 text-sm font-semibold">
                {model.subtitle}
              </div>
            )}
            <div className="-mt-1 text-[11px] text-[--model-muted]"></div>
          </div>

          {/* Top-right indicators */}
          {(isExperimental || isPremium || isKeyRequired) && (
            <div className="absolute right-1.5 top-1.5 text-[--model-muted] opacity-80">
              {isExperimental && <FlaskConical className="size-4" />}
              {isPremium && <Gem className="size-4" />}
              {isKeyRequired && <Key className="size-4" />}
            </div>
          )}
        </div>

        {/* Bottom capabilities */}
        <div className="absolute inset-x-0 bottom-3 flex w-full items-center justify-center gap-2">
          {model.capabilities.map((capability, index) => (
            <div
              key={index}
              className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md text-[--color] dark:text-[--color-dark]"
              style={
                {
                  "--color-dark": "hsl(168 54% 74%)",
                  "--color": "hsl(168 54% 52%)",
                } as React.CSSProperties
              }
              title={capability.label}
            >
              <div className="absolute inset-0 bg-current opacity-20 dark:opacity-15"></div>
              {capability.icon}
            </div>
          ))}
        </div>
      </button>

      {/* Pin button on hover */}
      <div className="absolute -right-1.5 -top-1.5 left-auto z-50 flex w-auto translate-y-2 scale-95 items-center rounded-[10px] border border-chat-border/40 bg-card p-1 text-xs text-muted-foreground opacity-0 transition-all group-hover:translate-y-0 group-hover:scale-100 group-hover:opacity-100">
        <Button
          variant="ghost"
          size="sm"
          className="cursor-pointer rounded-md bg-accent/30 p-1.5 hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
          aria-label="Pin model"
        >
          <Pin className="size-4" />
        </Button>
      </div>
    </div>
  );
}
