"use client";

import { Message } from "@/types/chat";
import { MessageActions } from "./Actions";
import { ReasoningDisplay } from "./ReasoningDisplay";
import { useContext, useMemo, memo, useState, useEffect, useRef } from "react";
import { ChatContext } from "@/context/ChatContext";
import { MarkdownContent } from "./MarkdownContent";
import {
  detectIncompleteCodeBlock,
  extractIncompleteCodeBlock,
} from "@/lib/code-utils";

import type { JSX } from "react";
import { CodeBlock, StreamingCodeBlock } from "./CodeBlock";

// Smooth transition component for partial images
const SmoothPartialImage = memo(function SmoothPartialImage({
  partialImage,
}: {
  partialImage: string;
}) {
  const [currentImage, setCurrentImage] = useState(partialImage);
  const [previousImage, setPreviousImage] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerHeight, setContainerHeight] = useState<number | undefined>(
    undefined
  );

  useEffect(() => {
    if (partialImage !== currentImage) {
      // Start transition
      setPreviousImage(currentImage);
      setIsTransitioning(true);

      // Capture current height to prevent layout shift
      if (containerRef.current) {
        setContainerHeight(containerRef.current.offsetHeight);
      }

      // Delay setting new image to allow for smooth transition
      const timer = setTimeout(() => {
        setCurrentImage(partialImage);
        setIsTransitioning(false);

        // Reset height after transition
        setTimeout(() => {
          setContainerHeight(undefined);
        }, 300);
      }, 150);

      return () => clearTimeout(timer);
    }
  }, [partialImage, currentImage]);

  // Clean up previous image after transition
  useEffect(() => {
    if (!isTransitioning) {
      setPreviousImage(null);
    }
  }, [isTransitioning]);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        height: containerHeight ? `${containerHeight}px` : "auto",
        minHeight: containerHeight ? `${containerHeight}px` : undefined,
      }}
    >
      {/* Current/New Image */}
      <div
        className={`transition-opacity duration-300 ${
          isTransitioning ? "opacity-0" : "opacity-100"
        }`}
      >
        <MarkdownContent content={currentImage} />
      </div>

      {/* Previous Image (for transition) */}
      {previousImage && isTransitioning && (
        <div
          className="absolute inset-0 transition-opacity duration-300 opacity-100"
          style={{ opacity: isTransitioning ? 0 : 1 }}
        >
          <MarkdownContent content={previousImage} />
        </div>
      )}
    </div>
  );
});

export const SimpleMessageRenderer = memo(function SimpleMessageRenderer({
  message,
}: {
  message: Message;
}) {
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
          ? "break-words overflow-wrap-anywhere bg-secondary rounded-2xl rounded-br-sm px-4 py-4 max-w-[80%]"
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
      <div className={isUser ? "break-words overflow-wrap-anywhere" : ""}>
        {processedContent}
      </div>

      {message.role === "assistant" && message.image_generation_status && (
        <div className="w-full flex justify-center items-center my-2 text-sm text-muted-foreground text-center">
          {message.image_generation_status}
        </div>
      )}
      {message.role === "assistant" &&
        !message.partial_image &&
        message.image_generation_status ===
          "Image generation in progress..." && (
          <div className="animate-pulse">
            <div className="w-full h-88 bg-muted rounded-lg"></div>
            <div className="mt-2 flex items-center gap-2">
              <div className="h-4 w-24 bg-muted rounded"></div>
              <div className="h-4 w-16 bg-muted rounded"></div>
            </div>
          </div>
        )}
      {/* Show partial image for assistant messages during generation with smooth transitions */}
      {message.role === "assistant" && message.partial_image && (
        <div className="w-full flex justify-center items-center mt-4">
          <SmoothPartialImage partialImage={message.partial_image} />
        </div>
      )}

      {/* Show branch button for assistant messages at the bottom - only visible on hover */}
      {message.role === "assistant" && activeUser?.id && (
        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <MessageActions
            conversationId={conversationId || message.conversationId}
            inputMessage={userInputMessage}
            message={message}
          />
        </div>
      )}
    </div>
  );
});
