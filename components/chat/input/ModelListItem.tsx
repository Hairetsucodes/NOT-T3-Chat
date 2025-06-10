import type { AIModel } from "@/types/models"
import { Info } from "lucide-react"
import { Button } from "@/components/ui/button"

interface ModelListItemProps {
  model: AIModel
  onSelect: (modelId: string) => void
}

export function ModelListItem({ model, onSelect }: ModelListItemProps) {
  const isDisabled = model.isDisabled

  return (
    <div
      role="menuitem"
      className={`relative select-none rounded-sm text-sm outline-none transition-colors focus:bg-accent/30 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 group flex flex-col items-start gap-1 px-3 py-3 ${
        isDisabled 
          ? "cursor-not-allowed hover:!bg-transparent [&>*:not(.preserve-hover)]:opacity-50" 
          : "cursor-default"
      }`}
      tabIndex={-1}
      onClick={() => !isDisabled && onSelect(model.id)}
    >
      <div className="flex w-full items-center justify-between">
        <div className={`flex items-center gap-2 pr-2 font-medium text-muted-foreground transition-colors ${isDisabled ? "opacity-50" : ""}`}>
          <div className="flex items-center justify-center size-4 text-color-heading">
            {model.icon}
          </div>
          <span className="w-fit text-sm">{model.name}</span>
          {model.isPro && (
            <div className="flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-[--model-muted]">
                <path d="M6 3h12l4 6-10 13L2 9Z"></path>
                <path d="M11 3 8 9l4 13 4-13-3-6"></path>
                <path d="M2 9h20"></path>
              </svg>
            </div>
          )}
          <Button variant="ghost" size="sm" className="p-1 h-auto ml-1">
            <Info className="size-3 text-color-heading" />
          </Button>
        </div>
        
        <div className="flex items-center gap-1.5">
          {model.capabilities.map((capability, index) => (
            <div
              key={index}
              className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-md text-[--color] dark:text-[--color-dark]"
              style={{
                "--color-dark": getCapabilityColor(capability.label).dark,
                "--color": getCapabilityColor(capability.label).light,
              } as React.CSSProperties}
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
  )
}

function getCapabilityColor(label: string) {
  const colors = {
    "Vision": { light: "hsl(168 54% 52%)", dark: "hsl(168 54% 74%)" },
    "Web Access": { light: "hsl(208 56% 52%)", dark: "hsl(208 56% 74%)" },
    "Files": { light: "hsl(237 55% 57%)", dark: "hsl(237 75% 77%)" },
    "Reasoning": { light: "hsl(263 58% 53%)", dark: "hsl(263 58% 75%)" },
  }
  return colors[label as keyof typeof colors] || { light: "hsl(210 40% 52%)", dark: "hsl(210 40% 74%)" }
} 