import { Message } from "@/types/chat";
import { MessageList } from "./message/MessageList";
import CornerDecorator from "./ui/CornerDecorator";
import { ModeToggle } from "@/components/settings/theme/Toggle";
import BackgroundGradient from "../ui/background-gradient";

export default function SharedChat({ messages }: { messages: Message[] }) {
  return (
    <div className="flex w-full h-screen relative">
      <BackgroundGradient />

      <div className="flex-1 relative z-10">
        <main className="relative flex w-full h-full flex-col overflow-hidden transition-[width,height]">
          <div className="absolute bottom-0 top-0 w-full overflow-hidden border-chat-border bg-chat-background bg-fixed transition-all ease-snappy md:border-l md:border-t md:translate-y-3.5 md:rounded-tl-xl">
            <div className="bg-noise absolute inset-0 bg-fixed transition-transform ease-snappy [background-position:right_bottom] md:-top-3.5"></div>
          </div>

          <CornerDecorator />

          <div className="absolute right-0 pt-3 pr-3 z-50">
            <ModeToggle aria-label="Toggle theme" />
          </div>

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
