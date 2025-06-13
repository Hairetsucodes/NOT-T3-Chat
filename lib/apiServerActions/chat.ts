"use server";

import { prisma } from "@/prisma";
import { z } from "zod";

export const createMessageApi = async (
  userId: string,
  content: string,
  role: string,
  provider: string,
  modelId: string,
  reasoningContent: string,
  conversationId?: string,
  title?: string
) => {
  // Create conversation if it doesn't exist
  if (!conversationId) {
    const conversation = await prisma.conversation.create({
      data: {
        userId,
        title: title || "New Conversation",
      },
    });
    conversationId = conversation.id;
  }

  // Validate required fields
  if (!content) {
    throw new Error("Content is required");
  }
  if (!role) {
    throw new Error("Role is required");
  }

  // Create and return the message
  const message = await prisma.message.create({
    data: {
      userId,
      conversationId,
      content,
      role,
      provider,
      model: modelId,
      reasoningContent,
    },
  });

  return message;
};

export const getPromptApi = async (promptId: string, userId: string) => {
  const prompt = await prisma.prompt.findFirst({
    where: { id: promptId, userId },
  });

  return prompt;
};

export const getAPIKeysApi = async (userId: string) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: userId,
      },
    });
    return apiKeys;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid user ID");
    }
    throw new Error("Failed to fetch API keys");
  }
}; 