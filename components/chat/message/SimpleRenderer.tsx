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

  // Language display mapping
  const languageMap: { [key: string]: string } = {
    js: "JavaScript",
    ts: "TypeScript",
    jsx: "React JSX",
    tsx: "React TSX",
    py: "Python",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    cs: "C#",
    php: "PHP",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    kt: "Kotlin",
    swift: "Swift",
    sh: "Shell",
    bash: "Bash",
    sql: "SQL",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    sass: "Sass",
    json: "JSON",
    xml: "XML",
    yaml: "YAML",
    yml: "YAML",
    md: "Markdown",
    dockerfile: "Dockerfile",
    text: "Plain Text",
  };

  const displayLanguage =
    languageMap[language.toLowerCase()] || language.toUpperCase();

  useLayoutEffect(() => {
    setIsLoading(true);
    highlight(code, language as BundledLanguage)
      .then((result) => {
        setHighlightedNode(result);
        setIsLoading(false);
      })
      .catch(() => {
        // Fallback to plain code
        setHighlightedNode(<code>{code}</code>);
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

  // GitHub-like code styling for immediate display
  const codeStyle = {
    whiteSpace: isWordWrapEnabled ? "pre-wrap" : "pre",
    wordBreak: isWordWrapEnabled ? "break-word" : "normal",
    overflowWrap: isWordWrapEnabled ? "break-word" : "normal",
    fontSize: "0.9em",
    lineHeight: "1.5",
    minWidth: isWordWrapEnabled ? "auto" : "max-content",
    fontFamily:
      "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    color: isLoading ? "var(--foreground)" : undefined,
  } as const;

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
        <div className="p-4 m-0 bg-sidebar relative">
          <div className="contentMarkdown" style={codeStyle}>
            {highlightedNode || <code className="text-foreground">{code}</code>}
          </div>
          {isLoading && (
            <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-50">
              Highlighting...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Streaming CodeBlock component for incomplete code blocks during streaming
function StreamingCodeBlock({ code, language }: { code: string; language: string }) {
  const [highlightedNode, setHighlightedNode] = useState<JSX.Element | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(true);

  // Language display mapping
  const languageMap: { [key: string]: string } = {
    js: "JavaScript",
    ts: "TypeScript",
    jsx: "React JSX",
    tsx: "React TSX",
    py: "Python",
    python: "Python",
    java: "Java",
    cpp: "C++",
    c: "C",
    cs: "C#",
    php: "PHP",
    rb: "Ruby",
    go: "Go",
    rs: "Rust",
    kt: "Kotlin",
    swift: "Swift",
    sh: "Shell",
    bash: "Bash",
    sql: "SQL",
    html: "HTML",
    css: "CSS",
    scss: "SCSS",
    sass: "Sass",
    json: "JSON",
    xml: "XML",
    yaml: "YAML",
    yml: "YAML",
    md: "Markdown",
    dockerfile: "Dockerfile",
    text: "Plain Text",
  };

  const displayLanguage =
    languageMap[language.toLowerCase()] || language.toUpperCase();

  useLayoutEffect(() => {
    setIsLoading(true);
    // Try to highlight the incomplete code, but be more forgiving of errors
    highlight(code, language as BundledLanguage)
      .then((result) => {
        setHighlightedNode(result);
        setIsLoading(false);
      })
      .catch(() => {
        // For incomplete code, fallback to plain code with proper styling
        setHighlightedNode(
          <code className="text-foreground">
            {code}
          </code>
        );
        setIsLoading(false);
      });
  }, [code, language]);

  // GitHub-like code styling
  const codeStyle = {
    whiteSpace: "pre-wrap" as const,
    wordBreak: "break-word" as const,
    overflowWrap: "break-word" as const,
    fontSize: "0.9em",
    lineHeight: "1.5",
    fontFamily:
      "ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
    color: isLoading ? "var(--foreground)" : undefined,
  };

  return (
    <div className="rounded-[4px] overflow-hidden bg-sidebar relative max-w-full">
      <div className="flex items-center justify-between bg-secondary px-4 py-1 shadow-sm border-b border-secondary-foreground/10">
        <div className="text-xs text-secondary-foreground font-medium">
          {displayLanguage} (streaming...)
        </div>
      </div>
      <div className="overflow-auto">
        <div className="p-4 m-0 bg-sidebar relative">
          <div className="contentMarkdown" style={codeStyle}>
            {highlightedNode || (
              <code className="text-foreground" style={codeStyle}>
                {code}
              </code>
            )}
          </div>
          {isLoading && (
            <div className="absolute top-2 right-2 text-xs text-muted-foreground opacity-50">
              Highlighting...
            </div>
          )}
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

    // Count opening and closing code block markers
    const openingCount = (content.match(/```/g) || []).length;
    const hasIncompleteCodeBlock = openingCount % 2 === 1; // Odd count means incomplete

    // Debug: log when we detect incomplete code blocks (only in development)
    if (process.env.NODE_ENV === 'development' && hasIncompleteCodeBlock) {
      console.log('🔄 Incomplete code block detected during streaming', { 
        openingCount, 
        contentLength: content.length,
        endsWithTripleBackticks: content.endsWith('```')
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
        // Find the last opening ``` in the remaining content
        const lastCodeBlockStart = remainingContent.lastIndexOf('```');
        
        if (lastCodeBlockStart !== -1) {
          // Add any content before the incomplete code block
          if (lastCodeBlockStart > 0) {
            const beforeIncomplete = remainingContent.slice(0, lastCodeBlockStart).trim();
            if (beforeIncomplete) {
              parts.push(
                <MarkdownContent
                  key={`pre-incomplete-${lastIndex}`}
                  content={beforeIncomplete}
                />
              );
            }
          }
          
          // Extract and render the incomplete code block
          const incompleteBlock = remainingContent.slice(lastCodeBlockStart);
          const match = incompleteBlock.match(/```(\w+)?(?:\n)?([\s\S]*)/);
          
          if (match) {
            const language = match[1] || "text";
            const code = match[2] || "";
            
            parts.push(
              <div key={`incomplete-code-${lastIndex + lastCodeBlockStart}`} className="my-4">
                <StreamingCodeBlock code={code} language={language} />
              </div>
            );
          }
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
