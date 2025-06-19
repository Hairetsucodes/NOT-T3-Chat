"use server";

import { checkUser } from "@/lib/auth/check";
import { prisma } from "@/prisma";
import { UserCustomization } from "@prisma/client";
import { generateAndApplyPersonalizedPrompt } from "./prompt";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import { 
  UpdateUserSettingsSchema, 
  UpdateWebSearchSchema, 
  UpdateModelAndProviderSchema, 
  UpdateImageGenerationSchema 
} from "@/schemas/settings";

export const getUserSettings = async () => {
  const { userId } = await checkUser();
  if (!userId) {
    return { error: "Unauthorized" };
  }
  try {
    // Check if user settings exist
    let settings = await prisma.userCustomization.findUnique({
      where: { userId },
    });

    // If no settings exist, try to create default settings
    if (!settings) {
      try {
        settings = await prisma.userCustomization.create({
          data: {
            userId: userId,
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
      } catch (createError) {
        // If creation failed due to race condition or unique constraint, fetch the existing record
        if (createError instanceof PrismaClientKnownRequestError && 
            createError.code === 'P2002') {
          settings = await prisma.userCustomization.findUnique({
            where: { userId },
          });
        } else {
          throw createError;
        }
      }
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
  settings: Partial<UserCustomization>
) => {
  try {
    // Validate and sanitize input data
    const validatedData = UpdateUserSettingsSchema.parse(settings);

    const { userId } = await checkUser();
    if (!userId) {
      return { error: "Unauthorized" };
    }

    // Try to update first
    try {
      const updatedSettings = await prisma.userCustomization.update({
        where: { userId },
        data: {
          ...validatedData,
          updatedAt: new Date(),
        },
      });
      
      // Handle prompt updates
      const promptRelevantFields = [
        "displayName",
        "userRole",
        "userTraits",
        "additionalContext",
      ];
      const hasPromptRelevantChanges = promptRelevantFields.some(
        (field) => validatedData[field as keyof typeof validatedData] !== undefined
      );
      
      if (hasPromptRelevantChanges) {
        const currentModelProvider = await prisma.chatSettings.findFirst({
          where: { userId },
          select: {
            provider: true,
            model: true,
          },
        });
        
        const hasAnyCustomization =
          updatedSettings.displayName ||
          updatedSettings.userRole ||
          updatedSettings.userTraits ||
          updatedSettings.additionalContext;

        if (hasAnyCustomization) {
          await generatePersonalizedPromptBackground(
            userId,
            currentModelProvider?.provider || "openai",
            currentModelProvider?.model || "gpt-4o-mini"
          ).catch((error) => {
            console.error("Background prompt generation failed:", error);
          });
        }
      }

      return updatedSettings;
    } catch (updateError) {
      // If update failed because record doesn't exist, create it
      if (updateError instanceof PrismaClientKnownRequestError && 
          updateError.code === 'P2025') {
        const defaultSettings = {
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
          ...validatedData,
        };

        return await prisma.userCustomization.create({
          data: defaultSettings,
        });
      }
      throw updateError;
    }
  } catch (error) {
    console.error("Error updating user settings:", error);
    if (error instanceof Error) {
      return { error: error.message };
    }
    return { error: "Failed to update settings" };
  }
};

// Background function to generate personalized prompt
async function generatePersonalizedPromptBackground(
  userId: string,
  provider: string,
  model: string
) {
  try {
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
      console.error("Error getting user chat settings:", schemaError);
    }

    // Get API key for the provider
    const apiKeyRecord = await prisma.apiKey.findFirst({
      where: { userId, provider },
    });

    if (!apiKeyRecord) {
      console.error(
        `No API key found for provider ${provider}, skipping prompt generation for user ${userId}`
      );
      return;
    }
    await generateAndApplyPersonalizedPrompt(provider, model, apiKeyRecord.key);
  } catch (error) {
    console.error("Error in background prompt generation:", error);
  }
}

export const deleteUserSettings = async () => {
  const { userId } = await checkUser();

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

export const resetUserSettings = async () => {
  const { userId } = await checkUser();
  if (!userId) {
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

export const getChatSettings = async () => {
  const { userId } = await checkUser();

  const chatSettings = await prisma.chatSettings.findFirst({
    where: { userId },
  });

  return chatSettings;
};

export const updateIsWebSearch = async (isWebSearch: boolean) => {
  try {
    // Validate input data
    const validatedData = UpdateWebSearchSchema.parse({ isWebSearch });

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const chatSettings = await prisma.chatSettings.findFirst({
      where: { userId },
    });
    if (chatSettings) {
      return await prisma.chatSettings.update({
        where: { id: chatSettings.id },
        data: { isWebSearch: validatedData.isWebSearch, updatedAt: new Date() },
      });
    }
    return null;
  } catch (error) {
    console.error("Error updating web search setting:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to update web search setting");
  }
};

export async function updateModelAndProvider(model: string, provider: string) {
  try {
    // Validate input data
    const validatedData = UpdateModelAndProviderSchema.parse({ model, provider });

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const existingSettings = await prisma.chatSettings.findFirst({
      where: { userId },
    });
    if (existingSettings) {
      return await prisma.chatSettings.update({
        where: { id: existingSettings.id },
        data: { 
          model: validatedData.model, 
          provider: validatedData.provider, 
          updatedAt: new Date() 
        },
      });
    } else {
      return await prisma.chatSettings.create({
        data: { 
          userId: userId, 
          model: validatedData.model, 
          provider: validatedData.provider 
        },
      });
    }
  } catch (error) {
    console.error("Error updating chat settings:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to update chat settings");
  }
}

export const updateIsImageGeneration = async (isImageGeneration: boolean) => {
  try {
    // Validate input data
    const validatedData = UpdateImageGenerationSchema.parse({ isImageGeneration });

    const { userId } = await checkUser();
    if (!userId) {
      throw new Error("Unauthorized");
    }

    const chatSettings = await prisma.chatSettings.findFirst({
      where: { userId },
    });
    if (chatSettings) {
      return await prisma.chatSettings.update({
        where: { id: chatSettings.id },
        data: { isImageGeneration: validatedData.isImageGeneration, updatedAt: new Date() },
      });
    }
    return null;
  } catch (error) {
    console.error("Error updating image generation setting:", error);
    if (error instanceof Error) {
      throw new Error(error.message);
    }
    throw new Error("Failed to update image generation setting");
  }
};
