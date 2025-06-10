"use client";

import { ChatInput } from "./input/ChatInput";
import { WelcomeScreen } from "./welcome/WelcomeScreen";
import { ChatHeader } from "./header/ChatHeader";
import CornerDecorator from "./header/CornerDecorator";
import { Message } from "@ai-sdk/react";
import { ChangeEvent } from "react";

interface ChatContainerProps {
  userName?: string;
  messages: Message[];
  input: string;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (event?: { preventDefault?: () => void } | undefined) => void;
  isLoading: boolean;
}

export function ChatContainer({
  userName = "User",
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: ChatContainerProps) {
  const handleSuggestionSelect = (suggestion: string) => {
    // TODO: Implement suggestion selection logic
    console.log("Suggestion selected:", suggestion);
  };

  return (
    <main className="relative flex w-full flex-1 flex-col overflow-hidden transition-[width,height]">
      {/* Background with borders */}
      <div className="absolute bottom-0 top-0 w-full overflow-hidden border-l border-t border-chat-border bg-chat-background bg-fixed pb-[140px] transition-all ease-snappy max-sm:border-none sm:translate-y-3.5 sm:rounded-tl-xl">
        <div className="bg-noise absolute inset-0 -top-3.5 bg-fixed transition-transform ease-snappy [background-position:right_bottom]"></div>
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
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* Main content scrollable area */}
      <div
        className="absolute inset-0 sm:pt-3.5 overflow-y-auto mt-4"
        style={{ paddingBottom: "144px", scrollbarGutter: "stable both-edges" }}
      >
        {messages.length === 0 ? (
          <WelcomeScreen
            userName={userName}
            onSelectSuggestion={handleSuggestionSelect}
          />
        ) : (
          <div className="flex flex-col w-full max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`whitespace-pre-wrap ${
                    message.role === "user"
                      ? "bg-chat-input-background text-white rounded-2xl rounded-br-sm px-4 py-4 max-w-[80%]"
                      : "text-foreground w-full"
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="text-muted-foreground">Thinking...</div>
              </div>
            )}
          </div>
        )}
      </div>

      <ChatHeader />
    </main>
  );
}
