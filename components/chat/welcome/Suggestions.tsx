"use client";

import { Button } from "@/components/ui/button";

interface SuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
  category: string;
}

const suggestionsByCategory = {
  create: [
    "Write a creative short story about time travel",
    "Help me brainstorm ideas for a mobile app",
    "Create a meal plan for the week",
    "Design a logo concept for my startup",
  ],
  explore: [
    "What are the latest breakthroughs in quantum computing?",
    "Explain the mysteries of black holes",
    "Tell me about ancient civilizations",
    "What's happening in space exploration?",
  ],
  code: [
    "Help me debug this React component",
    "Explain the difference between REST and GraphQL",
    "Write a Python function to sort an array",
    "What are the best practices for database design?",
  ],
  learn: [
    "How does machine learning work?",
    "Teach me about photosynthesis",
    "Explain cryptocurrency in simple terms",
    "What are the fundamentals of investing?",
  ],
};

export function Suggestions({ onSelectSuggestion, category }: SuggestionsProps) {
  const suggestions = suggestionsByCategory[category as keyof typeof suggestionsByCategory] || suggestionsByCategory.create;

  return (
    <div className="flex flex-col text-foreground">
      {suggestions.map((suggestion, index) => (
        <div
          key={index}
          className="flex items-start gap-2 border-t border-secondary/40 py-1 first:border-none"
        >
          <Button
            variant="ghost"
            className="w-full rounded-md py-2 text-left text-secondary-foreground hover:bg-sidebar-accent/50 sm:px-3 justify-start"
            onClick={() => onSelectSuggestion(suggestion)}
          >
            <span>{suggestion}</span>
          </Button>
        </div>
      ))}
    </div>
  );
} 