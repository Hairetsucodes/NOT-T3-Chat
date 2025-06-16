import { Message } from "@/types/chat";
import { ProviderConfig } from "@/types/llms";

export async function callProviderNonStreaming(
  messages: Message[],
  modelId: string,
  apiKey: string,
  config: ProviderConfig,
  providerName: string,
  maxTokens: number = 50
): Promise<string> {
  const transformedMessages = config.transformMessages
    ? config.transformMessages(messages)
    : messages;
  let body = config.transformBody
    ? config.transformBody(transformedMessages, modelId, maxTokens)
    : transformedMessages;

  if (typeof body === "object" && body !== null) {
    body = { ...body, max_tokens: maxTokens, temperature: 0.3, stream: false };
  }

  const response = await fetch(config.endpoint, {
    method: "POST",
    headers: config.headers(apiKey),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `${providerName} API error: ${response.status} - ${errorText}`
    );
  }

  const data = await response.json();
  return config.parseNonStreamContent ? config.parseNonStreamContent(data) : "";
}
