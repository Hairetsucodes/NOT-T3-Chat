import type { MessageContent, TextContentPart } from "@/types/chat";

/**
 * Detect if the request is asking for creative/unique content
 * This helps determine whether responses should be cached or generated fresh
 */
export const isCreativeRequest = (prompt: MessageContent[] | unknown): boolean => {
  // Extract text content from the last message, handling both string and array formats
  const messages = Array.isArray(prompt) ? (prompt as MessageContent[]) : [];
  const lastMessage = messages[messages.length - 1];
  if (!lastMessage) return false;

  let content = "";
  if (typeof lastMessage.content === "string") {
    content = lastMessage.content;
  } else if (Array.isArray(lastMessage.content)) {
    // Handle array of content parts (from AI SDK)
    content = lastMessage.content
      .filter(
        (part: TextContentPart | unknown): part is TextContentPart =>
          (part as TextContentPart)?.type === "text"
      )
      .map((part: TextContentPart) => part.text)
      .join(" ");
  }

  const lowerContent = content.toLowerCase();

  const creativeKeywords = [
    "write",
    "story",
    "poem",
    "creative",
    "generate",
    "create",
    "invent",
    "imagine",
    "fiction",
    "novel",
    "character",
    "plot",
    "narrative",
    "joke",
    "riddle",
    "song",
    "lyrics",
    "essay",
    "letter",
    "email",
    "unique",
    "original",
    "fresh",
    "new",
    "different",
    "random",
    "brainstorm",
    "idea",
    "concept",
    "design",
    "art",
    "creative writing",
  ];

  const factualKeywords = [
    "explain",
    "what is",
    "how does",
    "definition",
    "meaning",
    "concept",
    "tutorial",
    "guide",
    "documentation",
    "error",
    "debug",
    "fix",
    "code",
    "function",
    "api",
    "database",
    "algorithm",
    "syntax",
  ];

  // If it contains factual keywords, it's probably not creative
  const hasFactualKeywords = factualKeywords.some((keyword) =>
    lowerContent.includes(keyword)
  );

  if (hasFactualKeywords) return false;

  // Check for creative keywords
  const hasCreativeKeywords = creativeKeywords.some((keyword) =>
    lowerContent.includes(keyword)
  );

  return hasCreativeKeywords;
}; 