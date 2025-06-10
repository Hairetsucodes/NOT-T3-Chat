"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { InputActions } from "./InputActions";
import ModelSelector from "./ModelSelector";

interface ChatInputProps {
  onSubmit: (message: string) => void;
}

export function ChatInput({ onSubmit }: ChatInputProps) {
  const [message, setMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim()) {
      onSubmit(message.trim());
      setMessage("");
    }
  };

  return (
    <div className="pointer-events-auto">
      <div
        className="rounded-t-[20px] bg-chat-input-background p-2 pb-0 backdrop-blur-lg ![--c:--chat-input-gradient]"
        style={{
          "--gradientBorder-gradient":
            "linear-gradient(180deg, var(--min), var(--max), var(--min)), linear-gradient(15deg, var(--min) 50%, var(--max))",
          "--start": "#000000e0",
          "--opacity": "1",
        } as React.CSSProperties}
      >
        <form
          onSubmit={handleSubmit}
          className="relative flex w-full flex-col items-stretch gap-2 rounded-t-xl border border-b-0 border-white/70 bg-chat-input-background px-2 pt-3 text-secondary-foreground outline outline-8 outline-[hsl(var(--chat-input-gradient)/0.5)] pb-safe-offset-3 max-sm:pb-6 sm:max-w-3xl dark:border-[hsl(0,0%,83%)]/[0.04] dark:outline-chat-background/40"
        >
          <div className="flex flex-grow flex-col">
            <div className="flex flex-grow flex-row items-start">
              <textarea
                name="input"
                id="chat-input"
                placeholder="Type your message here..."
                className="w-full resize-none bg-transparent text-base leading-6 text-foreground outline-none placeholder:text-secondary-foreground/60 disabled:opacity-0"
                aria-label="Message input"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ height: "48px" }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
            </div>

            <div className="mt-2 flex w-full flex-row-reverse justify-between">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="callToAction"
                  size="icon"
                  type="submit"
                  disabled={!message.trim()}
                  aria-label={
                    message.trim() ? "Send message" : "Message requires text"
                  }
                >
                  <ArrowUp className="size-5" />
                </Button>
              </div>

              <div className="flex flex-col  sm:flex-row sm:items-center">
                <div className="flex items-center gap-1 pb-2">
                  <ModelSelector />
                  <InputActions />
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
} 