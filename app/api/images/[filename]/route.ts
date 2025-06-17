import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join, basename, extname } from "path";
import { existsSync } from "fs";
import { auth } from "@/auth";
import { getAttachmentFromAzure } from "@/fileStorage/azure";

const isLocal = process.env.AZURE_STORAGE_CONNECTION_STRING === undefined;

// Allowed image extensions
const ALLOWED_EXTENSIONS = new Set([
  ".jpg",
  ".jpeg",
  ".png",
  ".gif",
  ".webp",
  ".svg",
]);
const MAX_FILENAME_LENGTH = 255;

function sanitizeFilename(filename: string): string | null {
  if (!filename || typeof filename !== "string") {
    return null;
  }

  // Remove any null bytes (null byte injection attack)
  if (filename.includes("\0")) {
    return null;
  }

  // Limit filename length
  if (filename.length > MAX_FILENAME_LENGTH) {
    return null;
  }

  // Normalize and get basename to prevent path traversal
  const normalized = basename(filename);

  // Check if normalization changed the filename (indicates path traversal attempt)
  if (normalized !== filename) {
    return null;
  }

  // Whitelist approach: only allow alphanumeric, hyphens, underscores, and dots
  const allowedPattern = /^[a-zA-Z0-9._-]+$/;
  if (!allowedPattern.test(normalized)) {
    return null;
  }

  // Prevent filenames starting with dots (hidden files)
  if (normalized.startsWith(".")) {
    return null;
  }

  // Prevent reserved names (Windows)
  const reservedNames = [
    "CON",
    "PRN",
    "AUX",
    "NUL",
    "COM1",
    "COM2",
    "COM3",
    "COM4",
    "COM5",
    "COM6",
    "COM7",
    "COM8",
    "COM9",
    "LPT1",
    "LPT2",
    "LPT3",
    "LPT4",
    "LPT5",
    "LPT6",
    "LPT7",
    "LPT8",
    "LPT9",
  ];
  const nameWithoutExt = normalized.split(".")[0].toUpperCase();
  if (reservedNames.includes(nameWithoutExt)) {
    return null;
  }

  // Validate file extension
  const extension = extname(normalized).toLowerCase();
  if (!extension || !ALLOWED_EXTENSIONS.has(extension)) {
    return null;
  }

  // Additional check: ensure filename has proper structure
  // For your use case with "id-timestamp.ext" or "partial-id-number.ext"
  if (normalized.startsWith("partial-")) {
    // Validate partial filename format: partial-{id}-{number}.{ext}
    const partialPattern = /^partial-[a-zA-Z0-9_-]+-\d+\.[a-zA-Z0-9]+$/;
    if (!partialPattern.test(normalized)) {
      return null;
    }
  } else {
    // Validate regular filename format: {id}-{timestamp}.{ext}
    const regularPattern = /^[a-zA-Z0-9_-]+-[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$/;
    if (!regularPattern.test(normalized)) {
      return null;
    }
  }

  return normalized;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Sanitize filename with robust validation
    const sanitizedFilename = sanitizeFilename(filename);
    if (!sanitizedFilename) {
      return new NextResponse("Invalid filename", { status: 400 });
    }

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Handle both regular images (id-timestamp.ext) and partial images (partial-id-number.ext)
    let fileName: string;
    if (sanitizedFilename.startsWith("partial-")) {
      console.log("partial-", sanitizedFilename);
      console.log("userId", userId);
      // For partial images, use the entire filename as-is
      fileName = sanitizedFilename;
    } else {
      // For regular images, the filename format is: {userId}-{timestamp}.{ext}
      // But in Azure, it's stored as just {timestamp}.{ext} under the userId folder
      // So we need to extract just the timestamp part
      const filenameParts = sanitizedFilename.split("-");
      if (filenameParts.length >= 2) {
        fileName = filenameParts.slice(1).join("-"); // Get everything after the first dash
      } else {
        fileName = sanitizedFilename;
      }
    }

    let imageBuffer: Buffer;

    if (isLocal) {
      // Serve from local storage
      const filePath = join(
        process.cwd(),
        "local-attachment-store",
        userId,
        `${fileName}`
      );

      // Check if file exists
      if (!existsSync(filePath)) {
        return new NextResponse("Image not found", { status: 404 });
      }

      // Read the file
      imageBuffer = await readFile(filePath);
    } else {
      // Try Azure first, then fallback to local storage
      try {
        const blobResponse = await getAttachmentFromAzure(fileName, userId);
        if (!blobResponse.readableStreamBody) {
          throw new Error("No readable stream from Azure");
        }

        // Convert readable stream to buffer
        const chunks: Buffer[] = [];
        const stream = blobResponse.readableStreamBody;

        for await (const chunk of stream) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
        }

        imageBuffer = Buffer.concat(chunks);
      } catch (azureError: unknown) {
        // Only allow local fallback in development/localhost
        const isDevelopment = process.env.NODE_ENV === "development" || 
                            process.env.NEXTAUTH_URL === "http://localhost:3000";
        
        if (!isDevelopment) {
          console.error(`Azure blob not found for user ${userId}: ${fileName}`);
          return new NextResponse("Image not found", { status: 404 });
        }

        // Log concise error info for development
        const error = azureError as { code?: string; statusCode?: number };
        const errorCode = error?.code || "Unknown";
        const statusCode = error?.statusCode || "Unknown";
        console.log(`Azure ${errorCode} (${statusCode}) for ${fileName}, trying local fallback`);

        // Fallback to local storage
        try {
          const filePath = join(
            process.cwd(),
            "local-attachment-store",
            userId,
            `${fileName}`
          );

          // Check if file exists locally
          if (!existsSync(filePath)) {
            return new NextResponse(
              "Image not found in both Azure and local storage",
              { status: 404 }
            );
          }

          // Read the file from local storage
          imageBuffer = await readFile(filePath);
          console.log(
            "Successfully served image from local fallback:",
            fileName
          );
        } catch {
          console.error(
            "Local fallback failed for:",
            fileName
          );
          return new NextResponse("Image not found", { status: 404 });
        }
      }
    }

    // Determine content type based on file extension
    const extension = sanitizedFilename.toLowerCase().split(".").pop();
    let contentType = "image/jpeg"; // default

    switch (extension) {
      case "png":
        contentType = "image/png";
        break;
      case "jpg":
      case "jpeg":
        contentType = "image/jpeg";
        break;
      case "gif":
        contentType = "image/gif";
        break;
      case "webp":
        contentType = "image/webp";
        break;
      case "svg":
        contentType = "image/svg+xml";
        break;
    }

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error serving image:", error);
    return new NextResponse("Internal server error", { status: 500 });
  }
}
