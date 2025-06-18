"use client";

import { ChangeEvent, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { InputActions } from "./Actions";
import ModelSelector from "./ModelSelector";
import { Textarea } from "@/components/ui/textarea";

interface ChatInputProps {
  input: string;
  handleInputChange: (
    e: ChangeEvent<HTMLInputElement> | ChangeEvent<HTMLTextAreaElement>
  ) => void;
  handleSubmit: (
    event?: { preventDefault?: () => void; currentInput?: string } | undefined
  ) => void;
}

export function ChatInput({
  input,
  handleInputChange, // eslint-disable-line @typescript-eslint/no-unused-vars
  handleSubmit,
}: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const currentValue = textareaRef.current?.value || "";
    if (currentValue.trim()) {
      // Pass the current input value directly to handleSubmit
      handleSubmit({
        preventDefault: () => e.preventDefault(),
        currentInput: currentValue,
      });

      // Clear the textarea after submission
      if (textareaRef.current) {
        textareaRef.current.value = "";
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit(e);
    }
  };

  return (
    <div className="pointer-events-auto">
      <div
        className="rounded-t-[20px] bg-chat-input-background p-2 pb-0 backdrop-blur-lg ![--c:--chat-input-gradient]"
        style={
          {
            "--gradientBorder-gradient":
              "linear-gradient(180deg, var(--min), var(--max), var(--min)), linear-gradient(15deg, var(--min) 50%, var(--max))",
            "--start": "#000000e0",
            "--opacity": "1",
          } as React.CSSProperties
        }
      >
        <form
          onSubmit={onSubmit}
          className="relative flex w-full flex-col items-stretch gap-2 rounded-t-xl border border-b-0 border-white/70 bg-chat-input-background px-2 pt-3 text-secondary-foreground outline outline-8 outline-[hsl(var(--chat-input-gradient)/0.5)] pb-safe-offset-3 max-sm:pb-6 sm:max-w-3xl dark:border-[hsl(0,0%,83%)]/[0.04] dark:outline-chat-background/40"
        >
          <div className="flex flex-grow flex-col">
            <div className="flex flex-grow flex-row items-start">
              <Textarea
                ref={textareaRef}
                name="input"
                id="chat-input"
                placeholder="Type your message here..."
                className="w-full max-h-60 resize-none bg-transparent text-base leading-6 text-foreground outline-none placeholder:text-secondary-foreground/60 disabled:opacity-0"
                aria-label="Message input"
                defaultValue={input}
                rows={1}
                onKeyDown={handleKeyDown}
              />
            </div>

            <div className="mb-3 flex w-full flex-row-reverse justify-between">
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="callToAction"
                  size="icon"
                  type="submit"
                  aria-label="Send message"
                >
                  <ArrowUp className="size-5" />
                </Button>
              </div>

              <div className="flex flex-col  sm:flex-row sm:items-center">
                <div className="flex items-center gap-1">
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
