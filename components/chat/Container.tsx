"use client";

import { ChatInput } from "./input/Input";
import { WelcomeScreen } from "./welcome/Welcome";
import { ChatHeader } from "./ui/Header";
import CornerDecorator from "./ui/CornerDecorator";
import { ChatSkeleton } from "./ui/ChatSkeleton";
import { Suspense, useContext } from "react";
import { useSearchParams } from "next/navigation";
import { MessageList } from "./message/MessageList";
import { Spinner } from "@/components/ui/spinner";
import { ChatContext } from "@/context/ChatContext";

export function ChatContainer({
  welcomeMessage,
}: {
  welcomeMessage?: boolean;
}) {
  // Check for retry query parameter
  const searchParams = useSearchParams();
  const hasRetryParam = searchParams.get("retry") === "true";
  const {
    messages,
    input,
    isLoading,
    handleInputChange,
    handleSubmit,
    handleSuggestionSelect,
  } = useContext(ChatContext);

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
        <div className="relative mx-auto flex w-full max-w-[768px] flex-col text-center">
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
        {messages.length === 0 && !hasRetryParam && welcomeMessage ? (
          <WelcomeScreen onSelectSuggestion={handleSuggestionSelect} />
        ) : !welcomeMessage && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Spinner size="xl" type="spin" />
          </div>
        ) : (
          <Suspense fallback={<ChatSkeleton />}>
            <MessageList messages={messages} isLoading={isLoading} />
          </Suspense>
        )}
      </div>

      <ChatHeader />
    </main>
  );
}
