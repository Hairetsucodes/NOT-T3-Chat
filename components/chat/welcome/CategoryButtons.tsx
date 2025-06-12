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

export function CategoryButtons({
  selectedCategory,
  onCategorySelect,
}: CategoryButtonsProps) {
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
                ? "bg-gradient-to-b from-[rgb(180,80,120)] via-[rgb(150,65,95)] to-[rgb(130,50,80)] text-white border-[rgb(150,65,95)] shadow-md hover:shadow-lg hover:from-[rgb(200,100,140)] hover:via-[rgb(170,85,115)] hover:to-[rgb(150,70,100)] dark:from-pink-800/60 dark:via-pink-900/50 dark:to-pink-950/60 dark:border-pink-700/50 dark:hover:from-pink-700/70 dark:hover:via-pink-800/60 dark:hover:to-pink-950/70 ![--c:--primary]"
                : "border-secondary/60 bg-secondary/30 text-secondary-foreground dark:border-secondary dark:bg-chat-input-background dark:text-secondary-foreground ![--c:--chat-input-gradient]"
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
