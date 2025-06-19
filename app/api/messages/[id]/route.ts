import { NextRequest, NextResponse } from "next/server";
import { getMessagesByConversationId } from "@/data/messages";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Validate conversation ID
    if (!id || id.length < 10) {
      return NextResponse.json(
        { error: "Invalid conversation ID" },
        { status: 400 }
      );
    }

    // Load messages from database
    const messages = await getMessagesByConversationId(id);
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Error loading messages:", error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message === "Unauthorized") {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (error.message === "Conversation not found") {
        return NextResponse.json(
          { error: "Conversation not found" },
          { status: 404 }
        );
      }
    }

    return NextResponse.json(
      { error: "Failed to load messages" },
      { status: 500 }
    );
  }
}
