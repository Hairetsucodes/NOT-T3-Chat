import { z } from "zod";

// Font options based on your UI
const fontOptions = [
  "Inter",
  "Roboto",
  "Open Sans",
  "Lato",
  "Montserrat",
  "Poppins",
  "Source Sans Pro",
  "Nunito",
  "Raleway",
  "Ubuntu",
] as const;

const codeFontOptions = [
  "mono",
  "JetBrains Mono",
  "Fira Code",
  "Source Code Pro",
  "Consolas",
  "Monaco",
  "Menlo",
  "Courier New",
] as const;

// Schema for updating user customization settings
export const UpdateUserSettingsSchema = z.object({
  displayName: z
    .string()
    .max(50, "Display name must be 50 characters or less")
    .trim()
    .optional(),
  userRole: z
    .string()
    .max(100, "User role must be 100 characters or less")
    .trim()
    .optional(),
  userTraits: z
    .string()
    .max(3000, "User traits must be 3000 characters or less")
    .trim()
    .optional(),
  additionalContext: z
    .string()
    .max(3000, "Additional context must be 3000 characters or less")
    .trim()
    .optional(),
  isBoringTheme: z
    .boolean()
    .optional(),
  hidePersonalInfo: z
    .boolean()
    .optional(),
  disableThematicBreaks: z
    .boolean()
    .optional(),
  showStatsForNerds: z
    .boolean()
    .optional(),
  mainTextFont: z
    .enum(fontOptions, {
      errorMap: () => ({ message: "Invalid font selection" }),
    })
    .optional(),
  codeFont: z
    .enum(codeFontOptions, {
      errorMap: () => ({ message: "Invalid code font selection" }),
    })
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  {
    message: "At least one setting must be provided for update",
  }
);

// Schema for updating web search setting
export const UpdateWebSearchSchema = z.object({
  isWebSearch: z
    .boolean({
      required_error: "isWebSearch is required",
      invalid_type_error: "isWebSearch must be a boolean",
    }),
});

// Schema for updating model and provider
export const UpdateModelAndProviderSchema = z.object({
  model: z
    .string()
    .min(1, "Model is required")
    .max(100, "Model name is too long")
    .trim(),
  provider: z
    .string()
    .min(1, "Provider is required")
    .max(50, "Provider name is too long")
    .trim(),
});

// Schema for updating image generation setting
export const UpdateImageGenerationSchema = z.object({
  isImageGeneration: z
    .boolean({
      required_error: "isImageGeneration is required",
      invalid_type_error: "isImageGeneration must be a boolean",
    }),
});

// Type exports for TypeScript
export type UpdateUserSettingsRequest = z.infer<typeof UpdateUserSettingsSchema>;
export type UpdateWebSearchRequest = z.infer<typeof UpdateWebSearchSchema>;
export type UpdateModelAndProviderRequest = z.infer<typeof UpdateModelAndProviderSchema>;
export type UpdateImageGenerationRequest = z.infer<typeof UpdateImageGenerationSchema>; 