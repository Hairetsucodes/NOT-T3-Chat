import { Message } from "@/types/chat";
import { MessageList } from "./message/MessageList";
import CornerDecorator from "./ui/CornerDecorator";
import { ModeToggle } from "@/components/settings/theme/Toggle";

export default function SharedChat({ messages }: { messages: Message[] }) {
  return (
    <div className="flex w-full h-screen relative">
      <div className="absolute inset-0 dark:bg-sidebar !fixed z-0">
        {/* Light mode gradient */}
        <div
          className="absolute inset-0 opacity-40 dark:opacity-0"
          style={{
            backgroundImage: `radial-gradient(closest-corner at 120px 36px, rgba(255, 255, 255, 0.17), rgba(255, 255, 255, 0)), linear-gradient(rgb(254, 247, 255) 15%, rgb(244, 214, 250))`,
          }}
        ></div>
        {/* Dark mode gradient */}
        <div
          className="absolute inset-0 opacity-0 dark:opacity-40"
          style={{
            backgroundImage: `radial-gradient(closest-corner at 120px 36px, rgba(255, 1, 111, 0.19), rgba(255, 1, 111, 0.08)), linear-gradient(rgb(63, 51, 69) 15%, rgb(7, 3, 9))`,
          }}
        ></div>
        <div className="absolute inset-0 bg-noise"></div>
        <div className="absolute inset-0 bg-black/40 dark:block hidden"></div>
      </div>

      <div className="flex-1 relative z-10">
        <main className="relative flex w-full h-full flex-col overflow-hidden transition-[width,height]">
          {/* Background with borders */}
          <div className="absolute bottom-0 top-0 w-full overflow-hidden border-chat-border bg-chat-background bg-fixed transition-all ease-snappy md:border-l md:border-t md:translate-y-3.5 md:rounded-tl-xl">
            <div className="bg-noise absolute inset-0 bg-fixed transition-transform ease-snappy [background-position:right_bottom] md:-top-3.5"></div>
          </div>

          {/* Corner decoration */}
          <CornerDecorator />

          {/* Theme toggle button */}
          <div className="absolute right-0 pt-3 pr-3 z-50">
            <ModeToggle aria-label="Toggle theme" />
          </div>

          {/* Main content scrollable area */}
          <div
            className="absolute inset-0 overflow-y-auto mt-4 md:mt-4"
            style={{ scrollbarGutter: "stable both-edges" }}
          >
            <div className="flex flex-col h-full max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <MessageList messages={messages} isLoading={false} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
