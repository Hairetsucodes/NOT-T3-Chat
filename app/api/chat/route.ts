import { auth } from "@/auth";
import {
  handleLLMRequestStreaming,
  generateConversationTitle,
} from "@/ai/index";

import { getModelById } from "@/data/models";
import {
  getPromptApi,
  getProviderApiKey,
  getChatSettingsApi,
} from "@/lib/apiServerActions/chat";
import { validateChatRequest } from "@/lib/apiValidation/validate";
import { createMessageApi } from "@/lib/apiServerActions/chat";
import { createErrorResponse } from "@/utils/response";
import { validateProviderKey } from "@/utils/validation";
import { createStreamTransformer } from "@/utils/stream";

export async function POST(req: Request) {
  const validation = await validateChatRequest(req);
  if (validation.error) {
    return validation.error;
  }

  const { messages, conversationId, selectedModel } = validation.data;

  if (!selectedModel) {
    return createErrorResponse("No model selected");
  }

  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  try {
    // Get required data
    const [providerKey, settings] = await Promise.all([
      getProviderApiKey(userId, selectedModel.provider || "openai"),
      getChatSettingsApi(userId),
    ]);

    // Validate provider key
    const providerError = validateProviderKey(
      providerKey!,
      selectedModel.provider || "openai"
    );
    if (providerError) {
      return providerError;
    }

    // Get prompt if settings are valid
    const hasValidSettings =
      settings && !("error" in settings) && settings.promptId;
    const prompt = hasValidSettings
      ? await getPromptApi(settings.promptId!, userId)
      : null;

    // Generate title for new conversations (only if we have a provider key)
    const generatedTitle =
      !conversationId && providerKey
        ? await generateConversationTitle(messages, selectedModel, providerKey)
        : null;

    // Save user message and create/get conversation
    let currentConversationId: string | undefined = conversationId || undefined;
    const lastUserMessage = messages[messages.length - 1];

    if (lastUserMessage?.role === "user") {
      const savedMessage = await createMessageApi(
        userId,
        lastUserMessage.content,
        "user",
        selectedModel.provider,
        selectedModel.model,
        "",
        currentConversationId || undefined,
        generatedTitle || undefined
      );

      // If this was a new conversation, get the conversationId
      if (!currentConversationId && savedMessage) {
        currentConversationId = savedMessage.conversationId;
      }
    }

    // Get model information and create stream
    const modelInfo = await getModelById(selectedModel.model);
    const maxTokens = modelInfo?.maxOutput || undefined;
    const promptText =
      (prompt && "prompt" in prompt ? prompt.prompt : "") || "";

    const stream = await handleLLMRequestStreaming(
      messages,
      selectedModel.provider,
      selectedModel.model,
      providerKey!,
      promptText,
      new AbortController().signal,
      maxTokens
    );

    // Create transformed stream
    const transformedStream = createStreamTransformer(
      stream,
      userId,
      selectedModel,
      currentConversationId
    );

    // Prepare response headers
    const responseHeaders: Record<string, string> = {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "private, max-age=0, must-revalidate",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    };

    if (generatedTitle) {
      responseHeaders["X-Generated-Title"] = generatedTitle;
    }
    if (currentConversationId) {
      responseHeaders["X-Conversation-Id"] = currentConversationId;
    }

    return new Response(transformedStream, {
      status: 200,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response("Internal server error", { status: 500 });
  }
}
