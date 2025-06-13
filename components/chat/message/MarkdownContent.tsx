import { useState, useEffect } from "react";
import { processMarkdown } from "@/lib/markdownProcessor";

export function MarkdownContent({ content }: { content: string }) {
  const [html, setHtml] = useState<string>("");

  useEffect(() => {
    processMarkdown(content).then(setHtml);
  }, [content]);

  if (!html) {
    return <div className="text-muted-foreground text-sm">Loading...</div>;
  }

  return (
    <div
      className="contentMarkdown"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
