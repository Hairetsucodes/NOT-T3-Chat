"use client";

import { Button } from "@/components/ui/button";
import { Settings2 } from "lucide-react";
import { ModeToggle } from "@/components/settings/theme/Toggle";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import SettingsModal from "@/components/settings/SettingsModal";

export function ChatHeader() {
  return (
    <div className="absolute right-0 pt-3 pr-3 z-50">
      <Dialog>
        <DialogTrigger asChild>
          <Button
            variant="chatMenu"
            className="bg-transparent border-none"
            aria-label="Open settings"
          >
            <Settings2 />
          </Button>
        </DialogTrigger>
        <DialogContent className="h-[90vh] w-[90vw] max-w-[90vw] max-sm:h-[90vh] max-sm:w-[90vw] bg-background">
          <DialogTitle className="sr-only">Settings</DialogTitle>
          <SettingsModal />
        </DialogContent>
      </Dialog>
      <ModeToggle aria-label="Toggle theme" />
    </div>
  );
}
