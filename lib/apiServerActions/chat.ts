"use server";

import { prisma } from "@/prisma";
import { z } from "zod";
import { decrypt } from "@/lib/encryption/encrypt";

export const createMessageApi = async (
  userId: string,
  content: string,
  role: string,
  provider: string,
  modelId: string,
  reasoningContent: string,
  conversationId?: string,
  title?: string,
  responseId?: string,
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
  await prisma.conversation.update({
    where: { id: conversationId },
    data: {
      isGenerating: role === "user",
    },
  });

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
      responseId,
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

// Helper function to safely decrypt API keys
async function safeDecrypt(encryptedKey: string): Promise<string | undefined> {
  try {
    // Check if it looks like base64 encrypted data (our encrypted keys should be base64)
    if (encryptedKey.match(/^[A-Za-z0-9+/]+=*$/)) {
      return await decrypt(encryptedKey);
    }
  } catch (error) {
    console.warn("Failed to decrypt API key, returning as plain text:", error);
    return encryptedKey;
  }
}

export const getProviderApiKey = async (userId: string, provider: string) => {
  try {
    const apiKeys = await prisma.apiKey.findMany({
      where: {
        userId: userId,
        provider: provider,
      },
    });

    // Safely decrypt the API keys before returning
    const decryptedApiKey = await safeDecrypt(apiKeys[0].key);
    return decryptedApiKey;
  } catch (error) {
    console.error("Error fetching API keys:", error);
    if (error instanceof z.ZodError) {
      throw new Error("Invalid user ID");
    }
    throw new Error("Failed to fetch API keys");
  }
};

export const getChatSettingsApi = async (userId: string) => {
  const chatSettings = await prisma.chatSettings.findFirst({
    where: { userId },
  });

  return chatSettings;
};

export const createAttachmentApi = async (
  userId: string,
  filename: string,
  fileType: string,
  tileLocation: string,
  conversationId: string
) => {
  await prisma.attachment.create({
    data: {
      userId,
      filename,
      fileUrl: tileLocation,
      fileType: fileType,
      conversationId,
    },
  });
};

export const getLastResponseId = async (conversationId: string) => {
  const lastResponseId = await prisma.message.findFirst({
    where: { conversationId, role: "assistant" },
    orderBy: { createdAt: "desc" },
    select: {
      responseId: true,
    },
  });

  return lastResponseId?.responseId || undefined;
};
