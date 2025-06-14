"use server";
import { webcrypto } from "crypto";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET);
const salt = new TextEncoder().encode(process.env.API_KEY_SALT);
// Derive a key from the secret for encryption
async function getKey() {
  const keyMaterial = await webcrypto.subtle.importKey(
    "raw",
    secret,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  return webcrypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export const encrypt = async (text: string): Promise<string> => {
  const key = await getKey();
  const iv = webcrypto.getRandomValues(new Uint8Array(12));
  const encodedText = new TextEncoder().encode(text);

  const encrypted = await webcrypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encodedText
  );

  // Combine IV and encrypted data, then base64 encode
  const combined = new Uint8Array(iv.length + encrypted.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encrypted), iv.length);

  return Buffer.from(combined).toString("base64");
};

export const decrypt = async (encryptedText: string): Promise<string> => {
  const key = await getKey();
  const combined = Buffer.from(encryptedText, "base64");

  // Extract IV and encrypted data
  const iv = new Uint8Array(combined.slice(0, 12));
  const encrypted = new Uint8Array(combined.slice(12));

  const decrypted = await webcrypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    encrypted
  );

  return new TextDecoder().decode(decrypted);
};
