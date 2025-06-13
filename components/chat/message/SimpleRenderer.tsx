"use client";

import { Message } from "@/types/chat";
import { MessageActions } from "./Actions";
import { ReasoningDisplay } from "./ReasoningDisplay";
import {
  useContext,
  useMemo,
  useState,
  useLayoutEffect,
  useEffect,
  memo,
} from "react";
import { ChatContext } from "@/context/ChatContext";
import { highlight } from "@/lib/shiki-shared";
import { processMarkdown } from "@/lib/markdownProcessor";
import {
  normalizeLanguage,
  getLanguageDisplayName,
  detectIncompleteCodeBlock,
  extractIncompleteCodeBlock,
} from "@/lib/code-utils";
import {
  getCodeStyle,
  getStreamingCodeStyle,
  CODE_BLOCK_CLASSES,
} from "@/lib/code-styles";
import type { BundledLanguage } from "shiki/bundle/web";
import type { JSX } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check, WrapText, AlignLeft } from "lucide-react";

interface SimpleMessageRendererProps {
  message: Message;
}

// Styled CodeBlock component matching old SyntaxHighlightedCode
function CodeBlock({ code, language }: { code: string; language: string }) {
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

// Streaming CodeBlock component for incomplete code blocks during streaming
function StreamingCodeBlock({
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

// Simple Markdown component
function MarkdownContent({ content }: { content: string }) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    processMarkdown(content).then(setHtml);
  }, [content]);

  if (!html) {
    return <div className="text-muted-foreground text-sm">Loading...</div>;
  }

  return (
    <div
      className="contentMarkdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

export const SimpleMessageRenderer = memo(function SimpleMessageRenderer({
  message,
}: SimpleMessageRendererProps) {
  const isUser = message.role === "user";
  const { activeUser, conversationId, messages } = useContext(ChatContext);

  // Find the user message that prompted this assistant message
  const userInputMessage = useMemo(() => {
    if (message.role !== "assistant") return "";

    const currentMessageIndex = messages.findIndex(
      (msg) =>
        msg.id === message.id ||
        (msg.role === "assistant" && msg.content === message.content)
    );

    if (currentMessageIndex > 0) {
      const previousMessage = messages[currentMessageIndex - 1];
      if (previousMessage && previousMessage.role === "user") {
        return previousMessage.content;
      }
    }

    return "";
  }, [message, messages]);

  // Process content to handle code blocks and markdown (using deferred value)
  const processedContent = useMemo(() => {
    const content = message.content || "";

    if (isUser) {
      return (
        <div className="text-sm break-words overflow-wrap-anywhere">
          {content}
        </div>
      );
    }

    if (!content) {
      return null;
    }

    const hasIncompleteCodeBlock = detectIncompleteCodeBlock(content);

    // Debug: log when we detect incomplete code blocks (only in development)
    if (process.env.NODE_ENV === "development" && hasIncompleteCodeBlock) {
      console.log("🔄 Incomplete code block detected during streaming", {
        contentLength: content.length,
        lastTripleBacktick: content.lastIndexOf("```"),
        hasIncompleteCodeBlock,
      });
    }

    // Simple regex to find complete code blocks
    const codeBlockRegex = /```(\w+)?\n?([\s\S]*?)```/g;
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    let match;

    // Process complete code blocks first
    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text content before the code block
      if (match.index > lastIndex) {
        const textContent = content.slice(lastIndex, match.index).trim();
        if (textContent) {
          parts.push(
            <MarkdownContent key={`text-${lastIndex}`} content={textContent} />
          );
        }
      }

      // Add the complete code block
      const language = match[1] || "text";
      const code = match[2].trim();
      parts.push(
        <div key={`code-${match.index}`} className="my-4">
          <CodeBlock code={code} language={language} />
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Handle remaining content after all complete code blocks
    if (lastIndex < content.length) {
      const remainingContent = content.slice(lastIndex);

      if (hasIncompleteCodeBlock) {
        const extractedIncomplete =
          extractIncompleteCodeBlock(remainingContent);
        if (extractedIncomplete) {
          // Add any content before the incomplete code block
          if (extractedIncomplete.beforeIncomplete) {
            parts.push(
              <MarkdownContent
                key={`pre-incomplete-${lastIndex}`}
                content={extractedIncomplete.beforeIncomplete}
              />
            );
          }

          // Add the incomplete code block
          parts.push(
            <div key={`incomplete-code-${lastIndex}`} className="my-4">
              <StreamingCodeBlock
                code={extractedIncomplete.code}
                language={extractedIncomplete.language}
              />
            </div>
          );
        } else {
          // No ``` found but hasIncompleteCodeBlock is true, treat as regular markdown
          const trimmedRemaining = remainingContent.trim();
          if (trimmedRemaining) {
            parts.push(
              <MarkdownContent
                key={`text-${lastIndex}`}
                content={trimmedRemaining}
              />
            );
          }
        }
      } else {
        // No incomplete code block, process as regular markdown
        const trimmedRemaining = remainingContent.trim();
        if (trimmedRemaining) {
          parts.push(
            <MarkdownContent
              key={`text-${lastIndex}`}
              content={trimmedRemaining}
            />
          );
        }
      }
    }

    // If no code blocks were found, treat the whole content as markdown
    if (parts.length === 0) {
      return <MarkdownContent content={content} />;
    }

    return parts;
  }, [message.content, isUser]);

  return (
    <div
      className={`group ${
        message.role === "user"
          ? "whitespace-pre-wrap bg-secondary rounded-2xl rounded-br-sm px-4 py-4 max-w-[80%]"
          : "text-foreground w-full"
      }`}
    >
      {/* Show reasoning display for assistant messages at the top */}
      {message.role === "assistant" && message.reasoning_content && (
        <ReasoningDisplay
          reasoning={message.reasoning_content}
          isStreaming={false}
        />
      )}

      {/* Processed content with syntax highlighting and markdown */}
      <div
        className={
          isUser ? "break-words overflow-wrap-anywhere" : "whitespace-pre-wrap"
        }
      >
        {processedContent}
      </div>

      {/* Show branch button for assistant messages at the bottom - only visible on hover */}
      {message.role === "assistant" && activeUser?.id && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <MessageActions
            conversationId={conversationId || message.conversationId}
            userId={activeUser.id}
            inputMessage={userInputMessage}
            message={message}
            selectedRetryModel={message.model}
            selectedRetryProvider={message.provider}
          />
        </div>
      )}
    </div>
  );
});
