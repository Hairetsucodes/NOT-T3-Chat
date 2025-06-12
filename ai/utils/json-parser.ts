import { ParsedResponse, StreamChunk } from "@/types/llms";

/**
 * Robust JSON parser for streaming Server-Sent Events (SSE) responses
 * Handles incomplete JSON chunks and provides better error recovery
 */

export class StreamingJSONParser {
  private buffer = "";

  /**
   * Process a new chunk of data and return complete JSON objects
   */
  processChunk(chunk: string): StreamChunk[] {
    this.buffer += chunk;
    const results: StreamChunk[] = [];

    // Split by lines and process each
    const lines = this.buffer.split("\n");
    // Keep the last potentially incomplete line in buffer
    this.buffer = lines.pop() || "";

    for (const line of lines) {
      const trimmedLine = line.trim();
      if (!trimmedLine || !trimmedLine.startsWith("data: ")) continue;

      const data = trimmedLine.slice(6).trim();
      if (data === "[DONE]") continue;
      if (!data) continue;

      const parsed = this.parseJSON(data);
      if (parsed) {
        results.push(parsed);
      }
    }

    return results;
  }

  /**
   * Process any remaining data in the buffer
   */
  flush(): StreamChunk[] {
    if (!this.buffer.trim()) return [];

    const trimmedBuffer = this.buffer.trim();
    if (trimmedBuffer.startsWith("data: ")) {
      const data = trimmedBuffer.slice(6).trim();
      if (data && data !== "[DONE]") {
        const parsed = this.parseJSON(data);
        this.buffer = "";
        return parsed ? [parsed] : [];
      }
    }

    this.buffer = "";
    return [];
  }

  /**
   * Safely parse JSON with error handling
   */
  private parseJSON(data: string): StreamChunk | null {
    try {
      // Try to parse as-is first
      return this.extractContent(JSON.parse(data));
    } catch (error) {
      // Handle common streaming JSON issues
      const fixed = this.fixCommonJSONIssues(data);
      if (fixed !== data) {
        try {
          return this.extractContent(JSON.parse(fixed));
        } catch {
          // If still fails, it's likely an incomplete chunk - ignore silently
          return null;
        }
      }

      // Log only in development for debugging
      if (process.env.NODE_ENV === "development") {
        console.debug(
          "JSON parse error (likely incomplete chunk):",
          (error as Error).message
        );
      }
      return null;
    }
  }

  /**
   * Fix common JSON streaming issues
   */
  private fixCommonJSONIssues(data: string): string {
    let fixed = data;

    // Fix unterminated strings by adding closing quote if missing
    const stringMatches = fixed.match(/"[^"]*$/);
    if (stringMatches && !fixed.endsWith('"')) {
      fixed += '"';
    }

    // Fix incomplete objects/arrays
    const openBraces = (fixed.match(/{/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    let closeBraces = (fixed.match(/}/g) || []).length;
    let closeBrackets = (fixed.match(/]/g) || []).length;

    // Add missing closing braces/brackets
    while (openBraces > closeBraces) {
      fixed += "}";
      closeBraces++;
    }
    while (openBrackets > closeBrackets) {
      fixed += "]";
      closeBrackets++;
    }

    return fixed;
  }

  /**
   * Extract content and reasoning from parsed response
   */
  private extractContent(parsed: unknown): StreamChunk | null {
    if (!parsed || typeof parsed !== "object") return null;

    const result: StreamChunk = {};
    const parsedObj = parsed as ParsedResponse;

    // Handle OpenAI/XAI format
    if (parsedObj.choices?.[0]?.delta) {
      const delta = parsedObj.choices[0].delta;

      // Handle different reasoning content formats
      const reasoningContent =
        delta.reasoning ||
        delta.reasoning_content ||
        delta.thought ||
        delta.thinking;

      if (reasoningContent) {
        result.reasoning = reasoningContent;
      }

      if (delta.content) {
        result.content = delta.content;
      }
    }

    // Handle Anthropic format
    else if (
      parsedObj.type === "content_block_delta" &&
      parsedObj.delta?.text
    ) {
      result.content = parsedObj.delta.text;
    }

    // Handle direct content
    else if (parsedObj.content) {
      result.content = parsedObj.content;
    }

    return Object.keys(result).length > 0 ? result : null;
  }
}

/**
 * Create a simple JSON parser for one-off parsing
 */
export function parseStreamingJSON(data: string): StreamChunk | null {
  const parser = new StreamingJSONParser();
  const results = parser.processChunk(`data: ${data}\n`);
  return results[0] || null;
}
