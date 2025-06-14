import { Message } from "@/types/chat";
import { memo } from "react";
import { SimpleMessageRenderer } from "./SimpleRenderer";
import { LoadingBubbles } from "../ui/LoadingBubbles";

// Memoized message list to prevent unnecessary re-renders
export const MessageList = memo(function MessageList({
  messages,
  isLoading,
}: {
  messages: Message[];
  isLoading: boolean;
}) {
  return (
    <div className="flex flex-col w-full max-w-[770px] mx-auto px-4 py-8 space-y-6">
      {messages.map((message, index) => (
        <div
          key={
            message.id ||
            `message-${index}-${message.role}-${message.content?.slice(0, 50)}`
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
  );
});
