"use client";

import { Message } from "@/types/chat";
import {
  lazy,
  Suspense,
  useState,
  useRef,
  JSX,
  useEffect,
  useContext,
  useMemo,
} from "react";
import { processMarkdown } from "@/lib/markdownProcessor";
import { ReasoningDisplay } from "./ReasoningDisplay";
import { MessageActions } from "./Actions";
import { ChatContext } from "@/context/ChatContext";

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
  const [debouncedContent, setDebouncedContent] = useState(
    message.content || ""
  );
  const renderTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isUser = message.role === "user";
  const { activeUser, conversationId, messages } = useContext(ChatContext);

  // Debounce content updates for streaming
  useEffect(() => {
    const content = message.content || "";

    if (renderTimeoutRef.current) {
      clearTimeout(renderTimeoutRef.current);
    }

    const isStreamingUpdate =
      content.length > debouncedContent.length &&
      content.startsWith(debouncedContent);

    const contentDiff = content.length - debouncedContent.length;

    if (isStreamingUpdate && contentDiff < 100) {
      renderTimeoutRef.current = setTimeout(() => {
        setDebouncedContent(content);
      }, 32);
    } else {
      setDebouncedContent(content);
    }

    return () => {
      if (renderTimeoutRef.current) {
        clearTimeout(renderTimeoutRef.current);
      }
    };
  }, [message.content, debouncedContent]);

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

  // Memoize the expensive content rendering
  const renderedContent = useMemo(async () => {
    const content = debouncedContent;

    if (isUser) {
      return [
        <div key="user-message" className="text-sm">
          {content}
        </div>,
      ];
    }

    if (!content) {
      return [];
    }

    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts: JSX.Element[] = [];
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

    return parts;
  }, [debouncedContent, isUser]);

  // Use another state to hold the resolved rendered content
  const [resolvedContent, setResolvedContent] = useState<JSX.Element[]>([]);

  useEffect(() => {
    let isCancelled = false;

    renderedContent.then((content) => {
      if (!isCancelled) {
        setResolvedContent(content);
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [renderedContent]);

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
      {resolvedContent.length > 0 ? resolvedContent : message.content}

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
}
