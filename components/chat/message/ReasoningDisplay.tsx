"use client";

import React, { useState, useMemo, useCallback, memo, useEffect } from "react";
import { ChevronDown, ChevronRight, Brain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { processMarkdown } from "@/lib/markdownProcessor";

// Clean async markdown hook using useEffect
function useProcessedMarkdown(reasoning: string) {
  const [processed, setProcessed] = useState<string>("");
  
  useEffect(() => {
    if (!reasoning) {
      setProcessed("");
      return;
    }

    const result = processMarkdown(reasoning);
    
    if (typeof result === "string") {
      setProcessed(result);
    } else if (result && typeof result === "object" && "then" in result) {
      result.then(setProcessed);
    }
  }, [reasoning]);

  return processed;
}

// Move styles outside component to prevent recreation
const PIXEL_GLITCH_STYLES = `
  @keyframes pixelGlitch {
    0% {
      opacity: 0.3;
      transform: scale(0.95) translateX(-1px);
      filter: blur(1.5px) brightness(0.8);
      text-shadow: 1px 0 rgba(255, 0, 255, 0.4), -1px 0 rgba(0, 255, 255, 0.4);
    }
    30% {
      opacity: 0.8;
      transform: scale(1.08) translateX(0.5px);
      filter: blur(1px) brightness(1.3);
      text-shadow: 1.5px 0 rgba(255, 0, 255, 0.6), -1.5px 0 rgba(0, 255, 255, 0.6), 0 0 6px hsl(var(--primary) / 0.7);
    }
    60% {
      opacity: 0.95;
      transform: scale(0.98) translateX(-0.3px);
      filter: blur(0.5px) brightness(1.4);
      text-shadow: 0.8px 0 rgba(255, 0, 255, 0.3), -0.8px 0 rgba(0, 255, 255, 0.3), 0 0 10px hsl(var(--primary) / 0.8);
    }
    85% {
      opacity: 1;
      transform: scale(1.02) translateX(0.1px);
      filter: blur(0.2px) brightness(1.2);
      text-shadow: 0.3px 0 rgba(255, 0, 255, 0.2), -0.3px 0 rgba(0, 255, 255, 0.2), 0 0 8px hsl(var(--primary) / 0.6);
    }
    100% {
      opacity: 1;
      transform: scale(1) translateX(0);
      filter: blur(0) brightness(1.1);
      text-shadow: 0 0 8px hsl(var(--primary) / 0.5);
    }
  }
`;

// Extract title function outside component to prevent recreation
const extractTitle = (text: string): string => {
  if (!text) return "";

  // Find all **bold text** patterns and get the last one
  const boldMatches = text.match(/\*\*(.*?)\*\*/g);
  if (boldMatches && boldMatches.length > 0) {
    const lastBold = boldMatches[boldMatches.length - 1];
    const titleMatch = lastBold.match(/\*\*(.*?)\*\*/);
    if (titleMatch) {
      return titleMatch[1];
    }
  }

  // Find all markdown headers and get the last one
  const headerMatches = text.match(/^#{1,6}\s+(.*?)$/gm);
  if (headerMatches && headerMatches.length > 0) {
    const lastHeader = headerMatches[headerMatches.length - 1];
    const headerMatch = lastHeader.match(/^#{1,6}\s+(.*?)$/);
    if (headerMatch) {
      return headerMatch[1];
    }
  }

  // Fallback to first sentence
  const firstSentence = text.split(/[.!?]/)[0];
  if (firstSentence && firstSentence.length < 80) {
    return firstSentence.trim();
  }

  return "";
};

interface ReasoningDisplayProps {
  reasoning: string;
  isStreaming?: boolean;
}

export const ReasoningDisplay = memo(function ReasoningDisplay({
  reasoning,
  isStreaming,
}: ReasoningDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  // Use simplified custom hook instead of useEffect
  const reasoningTitle = useMemo(() => extractTitle(reasoning), [reasoning]);
  const resolvedRenderedReasoning = useProcessedMarkdown(reasoning);

  // Simple title-based animation trigger using key prop

  // Memoized toggle function to prevent recreations
  const toggleExpanded = useCallback(() => {
    setIsExpanded((prev) => !prev);
  }, []);

  // Memoized content rendering
  const expandedContent = useMemo(() => {
    if (!isExpanded) return null;

    return (
      <div className="px-3 pb-3 border-t border-border/30 bg-background">
        <div className="mt-3 text-sm text-muted-foreground">
          {resolvedRenderedReasoning ? (
            <div
              className="contentMarkdown prose prose-sm max-w-none"
              dangerouslySetInnerHTML={{ __html: resolvedRenderedReasoning }}
            />
          ) : reasoning ? (
            <div className="whitespace-pre-wrap">{reasoning}</div>
          ) : (
            <div className="flex items-center space-x-2 text-blue-500">
              <div className="w-3 h-3 bg-current rounded-full animate-pulse"></div>
              <span>Thinking...</span>
            </div>
          )}
        </div>
      </div>
    );
  }, [isExpanded, resolvedRenderedReasoning, reasoning]);

  // Early return for empty state
  if (!reasoning && !isStreaming) {
    return null;
  }

  return (
    <div className="mt-3 border border-border/50 rounded-lg bg-muted/30 overflow-hidden my-2">
      <style>{PIXEL_GLITCH_STYLES}</style>
      <Button
        variant="ghost"
        onClick={toggleExpanded}
        className="w-full justify-start p-1 h-auto text-sm hover:bg-muted/50 bg-secondary"
      >
        <Brain className="h-4 w-4 mr-2 text-blue-500" />
        <div className="flex flex-col items-start min-w-0 flex-1">
          <span
            key={reasoningTitle} // Force re-render on title change
            className={`font-medium transition-all duration-300 ${
              reasoningTitle ? "text-primary dark:text-primary" : ""
            }`}
            style={{
              textShadow: reasoningTitle
                ? "0 0 8px hsl(var(--primary) / 0.5)"
                : "none",
            }}
          >
            {reasoningTitle || "Reasoning"}
          </span>
          {reasoning && (
            <span className="text-xs text-muted-foreground">
              {reasoning.length} characters
            </span>
          )}
        </div>
        {isStreaming && (
          <div className="ml-2 flex items-center space-x-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-blue-500">thinking...</span>
          </div>
        )}
        <div className="ml-auto">
          {isExpanded ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </div>
      </Button>

      {expandedContent}
    </div>
  );
});
