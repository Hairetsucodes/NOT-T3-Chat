import {
  handleLLMRequestStreaming,
  generateConversationTitle,
} from "@/ai/index";
import { getModelById } from "@/data/models";
import { getPromptApi, getChatSettingsApi } from "@/lib/apiServerActions/chat";
import { validateChatRequestComplete } from "@/lib/apiValidation/validate";
import {
  createMessageApi,
  getLastResponseId,
} from "@/lib/apiServerActions/chat";
import { createStreamTransformer } from "@/utils/stream";
import { auth } from "@/auth";




export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return new Response("Unauthorized", { status: 401 });
  }

  const userId = session.user.id;

  // Comprehensive validation including model, and provider key
  const validation = await validateChatRequestComplete(req, userId);
  const { messages, conversationId, selectedModel, providerKey } =
    validation.data!;

  try {
    // Get chat settings
    const settings = await getChatSettingsApi(userId);

    // Get prompt if settings are valid
    const hasValidSettings =
      settings && !("error" in settings) && settings.promptId;
    const prompt = hasValidSettings
      ? await getPromptApi(settings.promptId!, userId)
      : null;

    // Generate title for new conversations
    const generatedTitle =
      !conversationId && providerKey
        ? await generateConversationTitle(messages, selectedModel, providerKey)
        : null;

    // Save user message and create/get conversation
    let currentConversationId: string | undefined = conversationId || undefined;
    const lastUserMessage = messages[messages.length - 1];
    let lastResponseId: string | undefined = undefined;

    if (conversationId && selectedModel.provider.toLowerCase() === "openai") {
      lastResponseId = await getLastResponseId(conversationId);
    }
    // Update conversation to indicate it's generating
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
      userId,
      currentConversationId || "",
      messages,
      selectedModel.provider,
      selectedModel.model,
      providerKey,
      promptText,
      new AbortController().signal,
      maxTokens,
      settings?.isWebSearch || false,
      settings?.isImageGeneration || false,
      lastResponseId || undefined
    );

    // Create transformed stream
    const { transformedStream } = await createStreamTransformer(
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
