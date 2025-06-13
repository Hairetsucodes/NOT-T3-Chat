"use client";

import { ChatInput } from "./input/Input";
import { WelcomeScreen } from "./welcome/Welcome";
import { ChatHeader } from "./ui/Header";
import CornerDecorator from "./ui/CornerDecorator";
import { LoadingBubbles } from "./ui/LoadingBubbles";
import { Message } from "@/types/chat";
import { ChangeEvent } from "react";
import { SimpleMessageRenderer } from "./message/SimpleRenderer";

interface ChatContainerProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (event?: { preventDefault?: () => void; currentInput?: string } | undefined) => void;
  handleSuggestionSelect: (suggestion: string) => void;
}

export function ChatContainer({
  messages,
  input,
  isLoading,
  handleInputChange,
  handleSubmit,
  handleSuggestionSelect,
}: ChatContainerProps) {
  return (
    <main className="relative flex w-full h-full flex-col overflow-hidden transition-[width,height]">
      {/* Background with borders */}
      <div className="absolute bottom-0 top-0 w-full overflow-hidden border-chat-border bg-chat-background bg-fixed pb-[140px] transition-all ease-snappy md:border-l md:border-t md:translate-y-3.5 md:rounded-tl-xl">
        <div className="bg-noise absolute inset-0 bg-fixed transition-transform ease-snappy [background-position:right_bottom] md:-top-3.5"></div>
      </div>

      {/* Corner decoration */}
      <CornerDecorator />

      {/* Chat input area */}
      <div className="absolute bottom-0 z-10 w-full px-2">
        <div className="relative mx-auto flex w-full max-w-3xl flex-col text-center">
          <ChatInput
            input={input}
            handleInputChange={handleInputChange}
            handleSubmit={handleSubmit}
          />
        </div>
      </div>

      {/* Main content scrollable area */}
      <div
        className="absolute inset-0 overflow-y-auto mt-4 md:mt-4"
        style={{ paddingBottom: "144px", scrollbarGutter: "stable both-edges" }}
      >
        {messages.length === 0 ? (
          <WelcomeScreen onSelectSuggestion={handleSuggestionSelect} />
        ) : (
          <div className="flex flex-col w-full max-w-[770px] mx-auto px-4 py-8 space-y-6">
            {messages.map((message, index) => (
              <div
                key={
                  message.id ||
                  `message-${index}-${message.role}-${message.content?.slice(
                    0,
                    50
                  )}`
                }
                className={`flex flex-col ${
                  message.role === "user" ? "items-end" : "items-start"
                }`}
              >
                <SimpleMessageRenderer message={message} />
              </div>
            ))}
            {/* Show loading animation immediately when submitting */}
            {isLoading && (
              <div className="flex flex-col items-start">
                <LoadingBubbles />
              </div>
            )}
          </div>
        )}
      </div>

      <ChatHeader />
    </main>
  );
}
