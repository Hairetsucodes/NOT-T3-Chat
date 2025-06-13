/**
 * Common styles and constants for code block rendering
 */
import type { CSSProperties } from "react";

/**
 * Base code styling that matches GitHub-like appearance
 */
export const getCodeStyle = (options: {
  isWordWrapEnabled?: boolean;
}): CSSProperties => ({
  whiteSpace: options.isWordWrapEnabled ? "pre-wrap" : "pre",
  wordBreak: options.isWordWrapEnabled ? "break-word" : "normal",
  overflowWrap: options.isWordWrapEnabled ? "break-word" : "normal",
  fontSize: "0.9em",
  lineHeight: "1.5",
  minWidth: options.isWordWrapEnabled ? "auto" : "max-content",
  fontFamily:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
});

/**
 * Streaming code block style (always with word wrap enabled)
 */
export const getStreamingCodeStyle = (): CSSProperties => ({
  whiteSpace: "pre-wrap" as const,
  wordBreak: "break-word" as const,
  overflowWrap: "break-word" as const,
  fontSize: "0.9em",
  lineHeight: "1.5",
  fontFamily:
    "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
});

/**
 * CSS classes for code block containers
 */
export const CODE_BLOCK_CLASSES = {
  container: "rounded-[4px] overflow-hidden bg-sidebar relative max-w-full",
  header: "flex items-center justify-between bg-secondary px-4 py-1 shadow-sm border-b border-secondary-foreground/10",
  languageLabel: "text-xs text-secondary-foreground font-medium",
  buttonGroup: "flex items-center gap-2",
  content: "contentMarkdown",
  contentContainer: " m-0 bg-sidebar relative",
  loadingIndicator: "absolute top-2 right-2 text-xs text-muted-foreground opacity-50",
} as const; 