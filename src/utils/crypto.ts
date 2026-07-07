/**
 * Web Crypto API Utility for Secure Client-Side AES-GCM Encryption
 * Provides robust, military-grade client-side encryption for offline data privacy.
 * This utilizes standard PBKDF2 key derivation and AES-GCM (256-bit) encryption.
 */

// Helper to convert ArrayBuffer to Hex String
function bufToHex(buffer: ArrayBuffer): string {
  return Array.prototype.map
    .call(new Uint8Array(buffer), (x) => ("00" + x.toString(16)).slice(-2))
    .join("");
}

// Helper to convert Hex String to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return bytes;
}

// Derive AES-GCM key from user password and salt using PBKDF2
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordBuffer = encoder.encode(password);

  // Import raw password bytes as a key-producing base
  const baseKey = await window.crypto.subtle.importKey(
    "raw",
    passwordBuffer,
    { name: "PBKDF2" },
    false,
    ["deriveKey"]
  );

  // Derive 256-bit AES-GCM key with 100,000 PBKDF2 iterations
  return await window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts a string of data using a user password.
 * Returns an object with ciphertext, salt, and IV encoded in Hex.
 */
export async function encryptText(text: string, password: string): Promise<{ ciphertext: string; salt: string; iv: string }> {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(text);

    // Generate random 16-byte salt and 12-byte IV (Initialization Vector)
    const salt = window.crypto.getRandomValues(new Uint8Array(16));
    const iv = window.crypto.getRandomValues(new Uint8Array(12));

    const aesKey = await deriveKey(password, salt);

    // Encrypt using AES-GCM
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      data
    );

    return {
      ciphertext: bufToHex(encryptedBuffer),
      salt: bufToHex(salt.buffer),
      iv: bufToHex(iv.buffer),
    };
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Nepodařilo se zašifrovat data. Zkontrolujte kompatibilitu prohlížeče.");
  }
}

/**
 * Decrypts hex-encoded ciphertext using a user password and matching salt and IV.
 * Returns the original decrypted string.
 */
export async function decryptText(ciphertext: string, saltHex: string, ivHex: string, password: string): Promise<string> {
  try {
    const salt = hexToBuf(saltHex);
    const iv = hexToBuf(ivHex);
    const encryptedData = hexToBuf(ciphertext);

    const aesKey = await deriveKey(password, salt);

    // Decrypt using AES-GCM
    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: "AES-GCM",
        iv: iv,
      },
      aesKey,
      encryptedData
    );

    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  } catch (error) {
    console.error("Decryption failed:", error);
    throw new Error("Chybná dešifrovací fráze nebo poškozená data.");
  }
}
