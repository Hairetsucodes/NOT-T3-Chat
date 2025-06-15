export interface ParsedStreamResponse {
  choices?: Array<{
    delta?: {
      content?: string;
      reasoning?: string;
      reasoning_content?: string;
      thought?: string;
      thinking?: string;
    };
  }>;
  type?: string;
  delta?: {
    text?: string;
  };
  content?: string;
}
