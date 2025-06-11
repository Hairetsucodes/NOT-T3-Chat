"use client";

import { Button } from "@/components/ui/button";
import { Sparkles, Newspaper, Code, GraduationCap } from "lucide-react";

const categories = [
  { icon: Sparkles, label: "Create", key: "create" },
  { icon: Newspaper, label: "Explore", key: "explore" },
  { icon: Code, label: "Code", key: "code" },
  { icon: GraduationCap, label: "Learn", key: "learn" },
];

interface CategoryButtonsProps {
  selectedCategory: string;
  onCategorySelect: (category: string) => void;
}

export function CategoryButtons({ selectedCategory, onCategorySelect }: CategoryButtonsProps) {
  return (
    <div className="flex flex-row flex-wrap gap-2.5 text-sm max-sm:justify-evenly">
      {categories.map((category) => {
        const Icon = category.icon;
        const isSelected = selectedCategory === category.key;

        return (
          <Button
            key={category.key}
            size="lg"
            variant="secondary"
            onClick={() => onCategorySelect(category.key)}
            className={`rounded-2xl border-1 border-solid backdrop-blur-lg py-2 px-4 transition-all ${
              isSelected
                ? "border-primary bg-primary/20 text-primary ![--c:--primary]"
                : "border-secondary bg-chat-input-background ![--c:--chat-input-gradient]"
            }`}
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
