"use client";

import { Button } from "@/components/ui/button";
import { Globe, Paperclip } from "lucide-react";

export function InputActions() {
  return (
    <>
      <Button
        variant="ghost"
        disabled
        className="text-xs h-auto gap-2 rounded-full border border-solid border-secondary-foreground/10 py-1.5 pl-2 pr-2.5 text-muted-foreground max-sm:p-2"
        aria-label="Web search not available on free plan"
        type="button"
      >
        <Globe className="h-4 w-4" />
        <span className="max-sm:hidden">Search</span>
      </Button>

      <Button
        variant="ghost"
        disabled
        className="text-xs h-auto gap-2 rounded-full border border-solid border-secondary-foreground/10 px-2 py-1.5 pr-2.5 text-muted-foreground max-sm:p-2"
        aria-label="Attaching files is a subscriber-only feature"
        type="button"
      >
        <Paperclip className="size-4" />
      </Button>
    </>
  );
} 