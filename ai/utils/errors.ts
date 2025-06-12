/**
 * Error handling utilities for LLM providers
 */

/**
 * Create a user-friendly error message from provider error
 */
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
 * Create an error stream for streaming responses
 */
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

/**
 * Create a standard error for non-streaming responses
 */
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

/**
 * Handle abort signals and create appropriate errors
 */
export function handleAbortError(signal?: AbortSignal): Error | null {
  if (signal?.aborted) {
    return new Error("Request was aborted");
  }
  return null;
}
