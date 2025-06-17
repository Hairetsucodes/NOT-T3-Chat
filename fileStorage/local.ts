import { createAttachmentApi } from "@/lib/apiServerActions/chat";
import fs from "fs";

export async function uploadAttachmentToLocal(
  attachment: File,
  filename: string,
  userId: string
) {
  const dirpath = `./local-attachment-store/${userId}`;
  if (!fs.existsSync(dirpath)) {
    fs.mkdirSync(dirpath, { recursive: true });
  }
  const filepath = `./local-attachment-store/${userId}/${filename}`;
  fs.writeFileSync(filepath, Buffer.from(await attachment.arrayBuffer()));
  createAttachmentApi(userId, filename, "image/png", filepath);
}

export async function getAttachmentFromLocal(blobName: string, userId: string) {
  const filepath = `./local-attachment-store/${userId}/${blobName}`;
  return fs.readFileSync(filepath);
}

export async function deleteAttachmentFromLocal(
  blobName: string,
  userId: string
) {
  const filepath = `./local-attachment-store/${userId}/${blobName}`;
  fs.unlinkSync(filepath);
}

export async function deletePartialImagesFromLocal(userId: string) {
  const dirpath = `./local-attachment-store/${userId}`;
  if (fs.existsSync(dirpath)) {
    fs.readdirSync(dirpath).forEach((file) => {
      if (file.startsWith("partial-")) {
        fs.unlinkSync(`${dirpath}/${file}`);
      }
    });
  }
}
