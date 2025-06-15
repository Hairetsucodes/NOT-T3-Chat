"use server";
import { join } from "path";
import { existsSync } from "fs";

/**
 * Import an image from the local attachment store and return the API URL
 * @param imagePath - Path to the image (e.g., "./local-attachment-store/1750004354396.png")
 * @returns API URL to serve the image or null if image doesn't exist
 */
export async function importImage(imagePath: string): Promise<string | null> {
  try {
    // Extract filename from path
    const filename = imagePath.split("/").pop();

    if (!filename) {
      console.warn("Invalid image path:", imagePath);
      return null;
    }

    // Construct the full file path to check if it exists
    const fullPath = join(process.cwd(), "local-attachment-store", filename);

    if (!existsSync(fullPath)) {
      console.warn("Image not found:", fullPath);
      return null;
    }

    // Return the API URL
    return `/api/images/${filename}`;
  } catch (error) {
    console.error("Error importing image:", error);
    return null;
  }
}
