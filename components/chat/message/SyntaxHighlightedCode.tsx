import { highlightCode } from "@/lib/shikiHighlighter";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { Check, Copy, WrapText, AlignLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "next-themes";

// Move helper functions outside component to prevent recreation
function normalizeLanguage(language: string, code: string): string {
  language = language.toLowerCase();
  if (
    language === "typescript" ||
    language === "ts" ||
    language === "tsx" ||
    language === "jsx"
  ) {
    return "typescript";
  }
  if (language === "javascript" || language === "js") {
    return "javascript";
  }
  if (!language && /^\s*\{[\s\S]*\}\s*$/.test(code)) {
    return "json";
  }
  return language || "plaintext";
}

// Helper function to escape HTML
function escapeHtml(text: string): string {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

interface SyntaxHighlightedCodeProps {
  code: string;
  language: string;
}

export function SyntaxHighlightedCode({
  code,
  language,
}: SyntaxHighlightedCodeProps) {
  const [highlightedCode, setHighlightedCode] = useState<string>("");
  const [isCopied, setIsCopied] = useState(false);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(false);
  const { theme, systemTheme } = useTheme();
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const lastHighlightedRef = useRef<{ code: string; language: string }>({
    code: "",
    language: "",
  });

  // Memoize expensive operations
  const normalizedLanguage = useMemo(() => normalizeLanguage(language, code), [language, code]);
  
  // Memoize theme calculation
  const isDark = useMemo(() => {
    const currentTheme = theme === "system" ? systemTheme : theme;
    return currentTheme === "dark";
  }, [theme, systemTheme]);

  // Memoize the highlight function to prevent unnecessary recreations
  const performHighlight = useCallback(async (codeToHighlight: string, lang: string) => {
    try {
      const highlighted = await highlightCode(codeToHighlight, lang, isDark);
      setHighlightedCode(highlighted);
      lastHighlightedRef.current = { code: codeToHighlight, language: lang };
    } catch (error) {
      console.error("Error highlighting code:", error);
      setHighlightedCode(`<pre><code>${escapeHtml(codeToHighlight)}</code></pre>`);
      lastHighlightedRef.current = { code: codeToHighlight, language: lang };
    }
  }, [isDark]);

  const debouncedHighlight = useCallback(
    (codeToHighlight: string, lang: string) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // For very short code changes during streaming, use minimal debounce
      const shouldDebounce =
        codeToHighlight.length > 100 &&
        lastHighlightedRef.current.code &&
        codeToHighlight.startsWith(lastHighlightedRef.current.code);

      if (shouldDebounce) {
        // Minimal debounce for streaming - much faster updates
        timeoutRef.current = setTimeout(() => {
          performHighlight(codeToHighlight, lang);
        }, 16); // ~60fps updates
      } else {
        performHighlight(codeToHighlight, lang);
      }
    },
    [performHighlight]
  );

  useEffect(() => {
    debouncedHighlight(code, normalizedLanguage);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [code, normalizedLanguage, debouncedHighlight]);

  const handleCopy = useCallback(() => {
    navigator.clipboard?.writeText(code).catch(console.error);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [code]);

  const toggleWordWrap = useCallback(() => {
    setIsWordWrapEnabled(prev => !prev);
  }, []);

  // Memoize the display language to prevent unnecessary recalculations
  const displayLanguage = useMemo(() => 
    normalizedLanguage === "plaintext" ? "text" : normalizedLanguage,
    [normalizedLanguage]
  );

  return (
    <div className="rounded-[4px] overflow-hidden bg-sidebar relative max-w-full">
      {/* Language label header */}
      <div className="flex items-center justify-between bg-secondary px-4 py-1 shadow-sm border-b border-secondary-foreground/10">
        <div className="text-xs text-secondary-foreground font-medium">
          {displayLanguage}
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={toggleWordWrap}
            variant="ghost"
            aria-label={
              isWordWrapEnabled ? "Disable word wrap" : "Enable word wrap"
            }
            title={isWordWrapEnabled ? "Disable word wrap" : "Enable word wrap"}
          >
            {isWordWrapEnabled ? (
              <AlignLeft className="w-4 h-4" />
            ) : (
              <WrapText className="w-4 h-4" />
            )}
          </Button>
          <Button onClick={handleCopy} variant="ghost" aria-label="Copy code">
            {isCopied ? (
              <Check className="w-4 h-4 text-green-500" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
      <div className={isWordWrapEnabled ? "overflow-auto" : "overflow-x-auto"}>
        <pre className="p-4 m-0 bg-sidebar">
          <div
            dangerouslySetInnerHTML={{ __html: highlightedCode }}
            style={{
              whiteSpace: isWordWrapEnabled ? "pre-wrap" : "pre",
              wordBreak: isWordWrapEnabled ? "break-word" : "normal",
              overflowWrap: isWordWrapEnabled ? "break-word" : "normal",
              fontSize: "0.9em",
              lineHeight: "1.5",
              minWidth: isWordWrapEnabled ? "auto" : "max-content",
            }}
          />
        </pre>
      </div>
    </div>
  );
}
