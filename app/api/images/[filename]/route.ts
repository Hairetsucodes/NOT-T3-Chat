import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";
import { auth } from "@/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }
    // Validate filename to prevent directory traversal TODO: Add more robust validation
    if (
      !filename ||
      filename.includes("..") ||
      filename.includes("/") ||
      filename.includes("\\")
    ) {
      return new NextResponse("Invalid filename", { status: 400 });
    }
    // Handle both regular images (id-timestamp.ext) and partial images (partial-id-number.ext)
    let fileName: string;
    if (filename.startsWith("partial-")) {
      // For partial images, use the entire filename as-is
      fileName = filename;
    } else {
      // For regular images, extract the actual filename after the first dash
      const filenameParts = filename.split("-");
      fileName = filenameParts[1];
    }
    
    // Construct the file path
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
    const imageBuffer = await readFile(filePath);

    // Determine content type based on file extension
    const extension = filename.toLowerCase().split(".").pop();
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
