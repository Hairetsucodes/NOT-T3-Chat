import { Message } from "@/types/chat";

export function ensureSystemMessage(messages: Message[]): Message[] {
  return messages.some((m) => m.role === "system")
    ? messages
    : [
        {
          role: "system",
          content: "You are a helpful assistant.",
          timestamp: new Date(),
        } as Message,
        ...messages,
      ];
}

export function ensureCustomSystemMessage(
  messages: Message[],
  prompt: string
): Message[] {
  const systemMessage: Message = {
    role: "system",
    content: prompt,
    timestamp: new Date(),
  };

  const nonSystemMessages = messages.filter((m) => m.role !== "system");
  return [systemMessage, ...nonSystemMessages];
}
