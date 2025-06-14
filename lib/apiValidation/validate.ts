"use server";
import { ChatRequestSchema } from "@/schemas/chatEndpoint";

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
