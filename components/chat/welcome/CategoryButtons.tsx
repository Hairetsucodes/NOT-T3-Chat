"use client";

import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Newspaper,
  Code,
  GraduationCap,
} from "lucide-react";

const categories = [
  { icon: Sparkles, label: "Create", key: "create" },
  { icon: Newspaper, label: "Explore", key: "explore" },
  { icon: Code, label: "Code", key: "code" },
  { icon: GraduationCap, label: "Learn", key: "learn" },
];

export function CategoryButtons() {
  return (
    <div className="flex flex-row flex-wrap gap-2.5 text-sm max-sm:justify-evenly">
      {categories.map((category) => {
        const Icon = category.icon;

        return (
          <Button
            key={category.key}
            size="lg"
            variant="secondary"
            className="rounded-2xl border-1 border-solid border-secondary bg-chat-input-background backdrop-blur-lg ![--c:--chat-input-gradient] py-2 px-4"
          >
            <div className="flex items-center gap-2">
              <Icon className="max-sm:block size-4" />
              <div>{category.label}</div>
            </div>
          </Button>
        );
      })}
    </div>
  );
} 