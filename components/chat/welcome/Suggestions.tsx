"use client";

import { Button } from "@/components/ui/button";

interface SuggestionsProps {
  onSelectSuggestion: (suggestion: string) => void;
}

const suggestions = [
  "How does AI work?",
  "Are black holes real?",
  'How many Rs are in the word "strawberry"?',
  "What is the meaning of life?",
];

export function Suggestions({ onSelectSuggestion }: SuggestionsProps) {
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