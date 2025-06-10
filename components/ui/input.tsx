import * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "w-full bg-transparent py-2 text-sm text-foreground placeholder-muted-foreground/50 placeholder:select-none focus:outline-none",
        className
      )}
      {...props}
    />
  );
}

export { Input };
