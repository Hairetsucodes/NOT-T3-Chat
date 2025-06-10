"use client";

import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { ModeToggle } from "@/components/settings/theme/Toggle";

export function ChatHeader() {
  return (
    <div className="absolute right-0 pt-3 pr-3 z-50">
      <Button variant="chatMenu" className="bg-transparent border-none">
        <Settings2 />
      </Button>
      <ModeToggle />
    </div>
  );
} 