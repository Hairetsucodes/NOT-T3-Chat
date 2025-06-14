/**
 * Utility functions for creating HTTP responses
 */

export function createErrorResponse(message: string, status: number = 400) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
} 