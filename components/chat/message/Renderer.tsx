"use client";

import { Message } from "@ai-sdk/react";
import { lazy, Suspense, useState, useRef, JSX, useEffect } from "react";
import { processMarkdown } from "@/lib/markdownProcessor";

// Lazy load the syntax highlighter
const SyntaxHighlightedCode = lazy(() =>
  import("./SyntaxHighlightedCode").then((module) => ({
    default: module.SyntaxHighlightedCode,
  }))
);

interface MessageRendererProps {
  message: Message;
}

export function MessageRenderer({ message }: MessageRendererProps) {
  const [renderedContent, setRenderedContent] = useState<JSX.Element[]>([]);
  const lastProcessedContentRef = useRef<string>("");
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processingRef = useRef<boolean>(false);
  const isUser = message.role === "user";

  const renderContent = async (content: string) => {
    if (isUser) {
      return [
        <div key="user-message" className="text-sm">
          {content}
        </div>,
      ];
    }

    if (processingRef.current) {
      return renderedContent;
    }

    if (content === lastProcessedContentRef.current) {
      return renderedContent;
    }

    processingRef.current = true;

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    // First, process complete code blocks
    while ((match = codeBlockRegex.exec(content)) !== null) {
      if (match.index > lastIndex) {
        const textContent = content.slice(lastIndex, match.index).trim();
        if (textContent) {
          const result = await processMarkdown(textContent);
          parts.push(
            <div
              key={`text-${lastIndex}`}
              className="contentMarkdown"
              dangerouslySetInnerHTML={{ __html: result }}
            />
          );
        }
      }

      const language = match[1] || "text";
      const code = match[2].trim();
      parts.push(
        <div
          key={`code-${match.index}`}
          className="w-full overflow-x-auto my-2"
        >
          <Suspense fallback={<div>Loading...</div>}>
            <SyntaxHighlightedCode code={code} language={language} />
          </Suspense>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Check for incomplete code block at the end (mid-streaming)
    const remainingContent = content.slice(lastIndex);
    const incompleteCodeMatch = remainingContent.match(
      /```(\w+)?\n?([\s\S]*)$/
    );

    if (incompleteCodeMatch) {
      // Handle text before the incomplete code block
      const textBeforeCode = remainingContent
        .slice(0, incompleteCodeMatch.index)
        .trim();
      if (textBeforeCode) {
        const result = await processMarkdown(textBeforeCode);
        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="contentMarkdown"
            dangerouslySetInnerHTML={{ __html: result }}
          />
        );
      }

      // Handle the incomplete code block
      const language = incompleteCodeMatch[1] || "text";
      const code = incompleteCodeMatch[2];
      parts.push(
        <div
          key={`incomplete-code-${
            lastIndex + (incompleteCodeMatch.index || 0)
          }`}
          className="w-full overflow-x-auto my-2 relative"
        >
          <Suspense fallback={<div>Loading...</div>}>
            <SyntaxHighlightedCode code={code} language={language} />
          </Suspense>
          {/* Show streaming indicator for incomplete code blocks */}
          <div className="absolute top-12 right-2 opacity-50">
            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
              <div className="w-2 h-2 bg-current rounded-full animate-pulse"></div>
              <span>writing...</span>
            </div>
          </div>
        </div>
      );
    } else if (lastIndex < content.length) {
      // Handle remaining text content (no incomplete code block)
      const textContent = remainingContent.trim();
      if (textContent) {
        const result = await processMarkdown(textContent);

        parts.push(
          <div
            key={`text-${lastIndex}`}
            className="contentMarkdown"
            dangerouslySetInnerHTML={{ __html: result }}
          />
        );
      }
    }

    lastProcessedContentRef.current = content;
    processingRef.current = false;
    return parts;
  };

  useEffect(() => {
    const content = message.content || "";

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    const isStreamingUpdate =
      content.length > lastProcessedContentRef.current.length &&
      content.startsWith(lastProcessedContentRef.current);

    const contentDiff = content.length - lastProcessedContentRef.current.length;

    if (isStreamingUpdate && contentDiff < 100) {
      renderTimeoutRef.current = setTimeout(() => {
        renderContent(content).then(setRenderedContent);
      }, 32); //
    } else {
      renderContent(content).then(setRenderedContent);
    }

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [message.content]); // Only depend on message.content, not lastProcessedContent

  return (
    <div
      className={`${
        message.role === "user"
          ? "whitespace-pre-wrap bg-secondary rounded-2xl rounded-br-sm px-4 py-4 max-w-[80%]"
          : "text-foreground w-full"
      }`}
    >
      {renderedContent.length > 0 ? renderedContent : message.content}
    </div>
  );
}
