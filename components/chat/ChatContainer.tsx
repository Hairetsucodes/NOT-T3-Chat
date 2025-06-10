"use client";

import { ChatInput } from "./input/ChatInput";
import { WelcomeScreen } from "./welcome/WelcomeScreen";
import { ChatHeader } from "./header/ChatHeader";
import CornerDecorator from "./header/CornerDecorator";

interface ChatContainerProps {
  userName?: string;
}

export function ChatContainer({ userName = "User" }: ChatContainerProps) {
  const handleSubmit = (message: string) => {
    // Handle message submission
    console.log("Message submitted:", message);
  };

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
            <ChatInput onSubmit={handleSubmit} />
        </div>
      </div>

      {/* Main content scrollable area */}
      <div
        className="absolute inset-0 sm:pt-3.5"
        style={{ paddingBottom: "144px", scrollbarGutter: "stable both-edges" }}
      >
        <WelcomeScreen
          userName={userName}
          onSelectSuggestion={handleSuggestionSelect}
        />
      </div>

      <ChatHeader />
    </main>
  );
} 