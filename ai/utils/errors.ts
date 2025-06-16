export function createUserFriendlyError(
  providerName: string,
  status: number,
  errorText: string
): string {
  let userFriendlyError = `${providerName} API error: ${status}`;

  try {
    const errorData = JSON.parse(errorText);
    if (errorData.error?.message) {
      userFriendlyError = errorData.error.message;
    } else if (errorData.message) {
      userFriendlyError = errorData.message;
    }
  } catch {
    userFriendlyError = errorText || userFriendlyError;
  }

  return userFriendlyError;
}

/**
 * Parse OpenAI API error to extract detailed error information
 */
export function parseOpenAIError(error: unknown): {
  code: number;
  message: string;
  isModelAccessError: boolean;
  isRateLimitError: boolean;
} {
  let code = 500;
  let message = "Unknown OpenAI API error";
  let isModelAccessError = false;
  let isRateLimitError = false;

  if (error && typeof error === "object") {
    const errorObj = error as Record<string, unknown>;

    // Extract status code
    if (typeof errorObj.status === "number") {
      code = errorObj.status;
    } else if (typeof errorObj.code === "number") {
      code = errorObj.code;
    }

    // Extract error message
    if (errorObj.error && typeof errorObj.error === "object") {
      const errorDetails = errorObj.error as Record<string, unknown>;
      if (typeof errorDetails.message === "string") {
        message = errorDetails.message;
      }
    } else if (typeof errorObj.message === "string") {
      message = errorObj.message;
    } else if (typeof errorObj === "string") {
      message = errorObj;
    }

    // Check for specific error types
    isModelAccessError =
      code === 404 ||
      message.includes("does not exist") ||
      message.includes("do not have access to it") ||
      message.includes("model not found") ||
      message.includes("invalid model");

    isRateLimitError =
      code === 429 ||
      message.includes("rate limit") ||
      message.includes("quota exceeded") ||
      message.includes("too many requests");
  }

  return { code, message, isModelAccessError, isRateLimitError };
}

/**
 * Create a user-friendly error message for model access issues
 */
export function createModelAccessErrorMessage(
  modelId: string,
  message: string
): string {
  let errorMessage = "**OpenAI Model Access Error**\n\n";

  errorMessage += `The model \`${modelId}\` is not available or you don't have access to it.\n\n`;

  errorMessage += "**💡 Possible solutions:**\n";
  errorMessage += "• Check if the model name is correct\n";
  errorMessage += "• Verify your OpenAI API key has access to this model\n";
  errorMessage += "• Try using a different model like:\n";
  errorMessage += "  - `gpt-4o-mini` (recommended)\n";
  errorMessage += "  - `gpt-4o`\n";
  errorMessage += "  - `gpt-3.5-turbo`\n\n";

  errorMessage += "You can change the model in your chat settings.\n\n";
  errorMessage += `**Technical details:** ${message}`;

  return errorMessage;
}

/**
 * Create a user-friendly error message for rate limit issues
 */
export function createRateLimitErrorMessage(message: string): string {
  let errorMessage = "**OpenAI Rate Limit Exceeded**\n\n";

  errorMessage += "You've exceeded your API request quota or rate limit.\n\n";

  errorMessage += "**💡 Solutions:**\n";
  errorMessage += "• Wait a few minutes before trying again\n";
  errorMessage += "• Check your OpenAI billing and usage limits\n";
  errorMessage += "• Consider upgrading your OpenAI plan\n";
  errorMessage += "• Try using a different model with lower usage\n\n";

  errorMessage += `**Technical details:** ${message}`;

  return errorMessage;
}

export function createErrorStream(
  providerName: string,
  status: number,
  errorText: string
): ReadableStream {
  const userFriendlyError = createUserFriendlyError(
    providerName,
    status,
    errorText
  );

  return new ReadableStream({
    start(controller) {
      controller.enqueue(
        new TextEncoder().encode(
          `data: ${JSON.stringify({
            content: `❌ **Error**: ${userFriendlyError}`,
          })}\n\n`
        )
      );
      controller.close();
    },
  });
}

export function createStandardError(
  providerName: string,
  status: number,
  errorText: string
): Error {
  const userFriendlyError = createUserFriendlyError(
    providerName,
    status,
    errorText
  );
  return new Error(
    `${providerName} API error: ${status} - ${userFriendlyError}`
  );
}

export function handleAbortError(signal?: AbortSignal): Error | null {
  if (signal?.aborted) {
    return new Error("Request was aborted");
  }
  return null;
}
