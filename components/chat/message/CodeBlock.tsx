import { JSX, useState } from "react";
import { getLanguageDisplayName } from "@/lib/code-utils";
import { highlight } from "@/lib/shiki-shared";
import { BundledLanguage } from "shiki/bundle/web";
import { normalizeLanguage } from "@/lib/code-utils";
import { useLayoutEffect } from "react";
import { getStreamingCodeStyle, CODE_BLOCK_CLASSES } from "@/lib/code-styles";
import { Button } from "@/components/ui/button";
import { WrapText, AlignLeft, Check, Copy } from "lucide-react";
import { getCodeStyle } from "@/lib/code-styles";

// Streaming CodeBlock component for incomplete code blocks during streaming
export function StreamingCodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [currentHighlight, setCurrentHighlight] = useState<JSX.Element | null>(
    null
  );
  const [smoothTransition, setSmoothTransition] = useState<JSX.Element | null>(
    null
  );

  const displayLanguage = getLanguageDisplayName(language);

  useLayoutEffect(() => {
    const highlightCode = () => {
      // Skip highlighting if code is empty or whitespace only
      if (!code.trim()) {
        const fallbackNode = <code className="text-foreground">{code}</code>;
        setCurrentHighlight(fallbackNode);
        setSmoothTransition(null);
        return;
      }

      // Keep current highlight visible while processing new content (prevents flashing)
      setSmoothTransition(currentHighlight);

      // Try to highlight the incomplete code, but be more forgiving of errors
      const normalizedLang = normalizeLanguage(language);
      highlight(code, normalizedLang as BundledLanguage)
        .then((result) => {
          setCurrentHighlight(result);
          setSmoothTransition(null); // Clear transition once new highlight is ready
        })
        .catch((error) => {
          console.warn(
            `Shiki streaming highlighting failed for language "${language}":`,
            error
          );
          // For incomplete code, fallback to plain code with proper styling
          const fallbackNode = <code className="text-foreground">{code}</code>;
          setCurrentHighlight(fallbackNode);
          setSmoothTransition(null);
        });
    };

    highlightCode();
  }, [code, language]);

  const codeStyle = getStreamingCodeStyle();

  // Display current highlight, or smooth transition while loading, or fallback
  const displayContent = currentHighlight || smoothTransition || (
    <code className="text-foreground" style={codeStyle}>
      {code}
    </code>
  );

  return (
    <div className={CODE_BLOCK_CLASSES.container}>
      <div className={CODE_BLOCK_CLASSES.header}>
        <div className={CODE_BLOCK_CLASSES.languageLabel}>
          {displayLanguage} (streaming...)
        </div>
      </div>
      <div className="overflow-auto">
        <div className={CODE_BLOCK_CLASSES.contentContainer}>
          <div className={CODE_BLOCK_CLASSES.content} style={codeStyle}>
            {displayContent}
          </div>
        </div>
      </div>
    </div>
  );
}

// Styled CodeBlock component matching old SyntaxHighlightedCode
export function CodeBlock({
  code,
  language,
}: {
  code: string;
  language: string;
}) {
  const [highlightedNode, setHighlightedNode] = useState<JSX.Element | null>(
    null
  );
  const [isCopied, setIsCopied] = useState(false);
  const [isWordWrapEnabled, setIsWordWrapEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const displayLanguage = getLanguageDisplayName(language);

  useLayoutEffect(() => {
    // Skip highlighting if code is empty or whitespace only
    if (!code.trim()) {
      setHighlightedNode(<code className="text-foreground">{code}</code>);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const normalizedLang = normalizeLanguage(language);
    highlight(code, normalizedLang as BundledLanguage)
      .then((result) => {
        setHighlightedNode(result);
        setIsLoading(false);
      })
      .catch((error) => {
        console.warn(
          `Shiki highlighting failed for language "${language}":`,
          error
        );
        // Fallback to plain code
        setHighlightedNode(<code className="text-foreground">{code}</code>);
        setIsLoading(false);
      });
  }, [code, language]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy code:", err);
    }
  };

  const toggleWordWrap = () => {
    setIsWordWrapEnabled(!isWordWrapEnabled);
  };

  const codeStyle = getCodeStyle({ isWordWrapEnabled });

  return (
    <div className={CODE_BLOCK_CLASSES.container}>
      {/* Language label header */}
      <div className={CODE_BLOCK_CLASSES.header}>
        <div className={CODE_BLOCK_CLASSES.languageLabel}>
          {displayLanguage}
        </div>
        <div className={CODE_BLOCK_CLASSES.buttonGroup}>
          <Button
            onClick={toggleWordWrap}
            variant="ghost"
            aria-label={
              isWordWrapEnabled ? "Disable word wrap" : "Enable word wrap"
            }
            title={isWordWrapEnabled ? "Disable word wrap" : "Enable word wrap"}
          >
            {isWordWrapEnabled ? (
              <WrapText className="w-4 h-4" />
            ) : (
              <AlignLeft className="w-4 h-4" />
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
        <div className={CODE_BLOCK_CLASSES.contentContainer}>
          <div className={CODE_BLOCK_CLASSES.content} style={codeStyle}>
            {highlightedNode || <code className="text-foreground">{code}</code>}
          </div>
          {isLoading && (
            <div className={CODE_BLOCK_CLASSES.loadingIndicator}>
              Highlighting...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
