"use server";
import { createAttachmentApi } from "@/lib/apiServerActions/chat";
import { BlobServiceClient } from "@azure/storage-blob";

const azureStorageConnectionString =
  process.env.AZURE_STORAGE_CONNECTION_STRING;
const containerName = process.env.AZURE_STORAGE_CONTAINER_NAME;

export async function uploadAttachmentToAzure(
  attachment: File,
  blobName: string,
  contentType: string,
  userId: string
) {
  try {
    if (!attachment) {
      throw new Error("Attachment is undefined");
    }

    const blobServiceClient = BlobServiceClient.fromConnectionString(
      azureStorageConnectionString!
    );
    const containerClient = blobServiceClient.getContainerClient(
      containerName!
    );
    const blobPath = `${userId}/${blobName}`;
    const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
    if (!blobName.startsWith('partial-')) {
      createAttachmentApi(userId, blobName, contentType, blobPath);
    }
    // Convert File to ArrayBuffer for Azure upload
    const arrayBuffer = await attachment.arrayBuffer();

    await blockBlobClient.upload(arrayBuffer, arrayBuffer.byteLength, {
      blobHTTPHeaders: {
        blobContentType: contentType,
      },
    });
  } catch (error) {
    console.error("Error uploading snapshot to Azure Blob Storage:", error);
  }
}

export async function getAttachmentFromAzure(blobName: string, userId: string) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    azureStorageConnectionString!
  );
  const containerClient = blobServiceClient.getContainerClient(containerName!);
  const blobPath = `${userId}/${blobName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  const blob = await blockBlobClient.download();
  return blob;
}

export async function deleteAttachmentFromAzure(
  blobName: string,
  userId: string
) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    azureStorageConnectionString!
  );
  const containerClient = blobServiceClient.getContainerClient(containerName!);
  const blobPath = `${userId}/${blobName}`;
  const blockBlobClient = containerClient.getBlockBlobClient(blobPath);
  await blockBlobClient.delete();
}

export async function deletePartialImagesFromAzure(userId: string) {
  const blobServiceClient = BlobServiceClient.fromConnectionString(
    azureStorageConnectionString!
  );
  const containerClient = blobServiceClient.getContainerClient(containerName!);
  const blobs = containerClient.listBlobsFlat();
  for await (const blob of blobs) {
    if (blob.name.startsWith(`${userId}/partial-`)) {
      await containerClient.deleteBlob(blob.name);
    }
  }
}
