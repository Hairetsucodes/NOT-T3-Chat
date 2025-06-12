"use server";

import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";
import { UserCustomization } from "@prisma/client";
import { generateAndApplyPersonalizedPrompt } from "@/ai/utils/prompt-generation";

export const getUserSettings = async (userId: string) => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {
    // Check if user settings exist
    let settings = await prisma.userCustomization.findUnique({
      where: { userId },
    });

    // If no settings exist, create default settings
    if (!settings) {
      settings = await prisma.userCustomization.create({
        data: {
          userId,
          displayName: "",
          userRole: "",
          userTraits: "",
          additionalContext: "",
          isBoringTheme: false,
          hidePersonalInfo: false,
          disableThematicBreaks: false,
          showStatsForNerds: false,
          mainTextFont: "Inter",
          codeFont: "mono",
        },
      });
    }

    return settings;
  } catch (error) {
    console.error("Error fetching user settings:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { error: "Failed to fetch settings" };
  }
};

export const updateUserSettings = async (
  userId: string,
  settings: Partial<UserCustomization>
) => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {
    // Validate settings
    if (settings.displayName && settings.displayName.length > 50) {
      return { error: "Display name must be 50 characters or less" };
    }

    if (settings.userRole && settings.userRole.length > 100) {
      return { error: "User role must be 100 characters or less" };
    }

    if (settings.userTraits && settings.userTraits.length > 3000) {
      return { error: "User traits must be 3000 characters or less" };
    }

    if (
      settings.additionalContext &&
      settings.additionalContext.length > 3000
    ) {
      return { error: "Additional context must be 3000 characters or less" };
    }

    // Check if settings exist, create or update accordingly
    const existingSettings = await prisma.userCustomization.findUnique({
      where: { userId },
    });

    let updatedSettings;

    if (existingSettings) {
      // Update existing settings
      updatedSettings = await prisma.userCustomization.update({
        where: { userId },
        data: {
          ...settings,
          updatedAt: new Date(),
        },
      });
    } else {
      // Create new settings with provided data and defaults
      updatedSettings = await prisma.userCustomization.create({
        data: {
          userId,
          displayName: settings.displayName || "",
          userRole: settings.userRole || "",
          userTraits: settings.userTraits || "",
          additionalContext: settings.additionalContext || "",
          isBoringTheme: settings.isBoringTheme || false,
          hidePersonalInfo: settings.hidePersonalInfo || false,
          disableThematicBreaks: settings.disableThematicBreaks || false,
          showStatsForNerds: settings.showStatsForNerds || false,
          mainTextFont: settings.mainTextFont || "Inter",
          codeFont: settings.codeFont || "mono",
        },
      });
    }

    // Check if prompt-relevant fields were updated
    const promptRelevantFields = [
      "displayName",
      "userRole",
      "userTraits",
      "additionalContext",
    ];
    const hasPromptRelevantChanges = promptRelevantFields.some(
      (field) => settings[field as keyof UserCustomization] !== undefined
    );

    // If prompt-relevant fields were updated and user has any customization data, generate new prompt
    if (hasPromptRelevantChanges) {
      const hasAnyCustomization =
        updatedSettings.displayName ||
        updatedSettings.userRole ||
        updatedSettings.userTraits ||
        updatedSettings.additionalContext;

      if (hasAnyCustomization) {
        // Generate personalized prompt in the background
        // Don't await this to avoid blocking the settings update
        generatePersonalizedPromptBackground(userId).catch((error) => {
          console.error("Background prompt generation failed:", error);
        });
      }
    }

    return updatedSettings;
  } catch (error) {
    console.error("Error updating user settings:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { error: "Failed to update settings" };
  }
};

// Background function to generate personalized prompt
async function generatePersonalizedPromptBackground(userId: string) {
  try {
    let provider = "openai";
    let model = "gpt-4o-mini";

    // Try to get user's preferred model/provider, but handle schema mismatch gracefully
    try {
      const userChatSettings = await prisma.chatSettings.findFirst({
        where: { userId },
        select: {
          provider: true,
          model: true,
        },
        orderBy: { updatedAt: "desc" },
      });

      if (userChatSettings) {
        provider = userChatSettings.provider;
        model = userChatSettings.model;
      }
    } catch (schemaError) {
      console.log(
        `Using default provider/model due to schema mismatch for user ${userId}:`,
        schemaError instanceof Error ? schemaError.message : "Unknown error"
      );
    }

    // Get API key for the provider
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: { userId, provider },
    });

    if (!apiKeyRecord) {
      console.log(
        `No API key found for provider ${provider}, skipping prompt generation for user ${userId}`
      );
      return;
    }

    // Generate and apply the personalized prompt
    const promptId = await generateAndApplyPersonalizedPrompt(
      userId,
      provider,
      model,
      apiKeyRecord.key
    );

    if (promptId) {
      console.log(
        `✅ Successfully generated personalized prompt ${promptId} for user ${userId}`
      );
    } else {
      console.log(
        `❌ Failed to generate personalized prompt for user ${userId}`
      );
    }
  } catch (error) {
    console.error("Error in background prompt generation:", error);
  }
}

export const deleteUserSettings = async (userId: string) => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {
    const deletedSettings = await prisma.userCustomization.delete({
      where: { userId },
    });

    return { success: true, deletedSettings };
  } catch (error) {
    console.error("Error deleting user settings:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { error: "Failed to delete settings" };
  }
};

export const resetUserSettings = async (userId: string) => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  try {
    const resetSettings = await prisma.userCustomization.upsert({
      where: { userId },
      update: {
        displayName: "",
        userRole: "",
        userTraits: "",
        additionalContext: "",
        isBoringTheme: false,
        hidePersonalInfo: false,
        disableThematicBreaks: false,
        showStatsForNerds: false,
        mainTextFont: "Inter",
        codeFont: "mono",
        updatedAt: new Date(),
      },
      create: {
        userId,
        displayName: "",
        userRole: "",
        userTraits: "",
        additionalContext: "",
        isBoringTheme: false,
        hidePersonalInfo: false,
        disableThematicBreaks: false,
        showStatsForNerds: false,
        mainTextFont: "Inter",
        codeFont: "mono",
      },
    });

    return resetSettings;
  } catch (error) {
    console.error("Error resetting user settings:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
      console.error("Error stack:", error.stack);
    }
    return { error: "Failed to reset settings" };
  }
};

export const getPrompt = async (promptId: string, userId: string) => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  const prompt = await prisma.prompt.findFirst({
    where: { id: promptId, userId },
  });

  return prompt;
};

export const getChatSettings = async (userId: string) => {
  const { success } = await checkUser({ userId });
  if (!success) {
    return { error: "Unauthorized" };
  }

  const chatSettings = await prisma.chatSettings.findFirst({
    where: { userId },
  });

  return chatSettings;
};
