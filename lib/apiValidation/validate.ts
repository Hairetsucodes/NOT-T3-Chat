"use server";
import { ChatRequestSchema } from "@/schemas/chatEndpoint";
import { getProviderApiKey } from "@/lib/apiServerActions/chat";
import { validateProviderKey } from "@/utils/validation";

export async function validateChatRequest(req: Request) {
  // Parse and validate JSON body
  let body;
  try {
    body = await req.json();
  } catch {
    return {
      error: new Response(JSON.stringify({ error: "Invalid JSON format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  // Validate request body structure
  const validationResult = ChatRequestSchema.safeParse(body);
  if (!validationResult.success) {
    return {
      error: new Response(
        JSON.stringify({
          error: "Invalid request format",
          details: validationResult.error.errors.map((err) => ({
            field: err.path.join("."),
            message: err.message,
          })),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      ),
    };
  }

  return { data: validationResult.data };
}

export async function validateChatRequestComplete(
  req: Request,
  userId: string
) {
  // First validate the basic request structure
  const basicValidation = await validateChatRequest(req);
  if (basicValidation.error) {
    return basicValidation;
  }

  const { messages, conversationId, selectedModel, lastResponseId } =
    basicValidation.data;

  // Validate model selection
  if (!selectedModel) {
    return {
      error: new Response(JSON.stringify({ error: "No model selected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    };
  }

  try {
    // Get and validate provider key
    const providerKey = await getProviderApiKey(
      userId,
      selectedModel.provider || "openai"
    );

    const providerError = validateProviderKey(
      providerKey!,
      selectedModel.provider || "openai"
    );
    if (providerError) {
      return { error: providerError };
    }

    return {
      data: {
        messages,
        conversationId,
        selectedModel,
        providerKey: providerKey!,
        lastResponseId,
      },
    };
  } catch (error) {
    console.error("Validation error:", error);
    return {
      error: new Response("Internal server error", { status: 500 }),
    };
  }
}
