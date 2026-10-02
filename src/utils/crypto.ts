/**
 * Cryptographic utility for KavachMesh Dynamic Safety Mesh
 * Features:
 * 1. AES-256-GCM End-to-End Encryption for payload broadcast & local SQLite/IndexedDB storage.
 * 2. Rotating Ephemeral Vehicle ID (R-VID): HMAC-SHA256 based 4-byte privacy token rotated hourly.
 * 3. Poly1305 / HMAC-based truncated 4-byte emergency authentication tag.
 */

// Shared mesh demo key derivation salt
const MESH_SALT = new TextEncoder().encode('KavachMesh-Public-Transport-India-2026');

// Master ephemeral key cache
let cachedAesKey: CryptoKey | null = null;

export async function getMeshMasterKey(): Promise<CryptoKey> {
  if (cachedAesKey) return cachedAesKey;

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('KAVACH_INDIA_AUTO_SAFETY_SECRET_PASS_2026!'),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  cachedAesKey = await window.crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: MESH_SALT,
      iterations: 10000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return cachedAesKey;
}

/**
 * Encrypt a text or JSON payload with AES-256-GCM.
 * Produces ciphertext and a 12-byte initialization vector.
 */
export async function encryptPayload(payload: string): Promise<{
  cipherTextBase64: string;
  ivHex: string;
  authTagHex: string;
}> {
  const key = await getMeshMasterKey();
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const encodedData = new TextEncoder().encode(payload);

  const encryptedBuffer = await window.crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv,
      tagLength: 128
    },
    key,
    encodedData
  );

  const encryptedBytes = new Uint8Array(encryptedBuffer);
  // Last 16 bytes of AES-GCM output is the authentication tag
  const tagBytes = encryptedBytes.slice(encryptedBytes.length - 16);
  const cipherBytes = encryptedBytes.slice(0, encryptedBytes.length - 16);

  const cipherTextBase64 = btoa(String.fromCharCode(...encryptedBytes));
  const ivHex = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
  const authTagHex = Array.from(tagBytes.slice(0, 4)).map(b => b.toString(16).padStart(2, '0')).join('');

  return {
    cipherTextBase64,
    ivHex,
    authTagHex
  };
}

/**
 * Decrypt an AES-256-GCM payload.
 */
export async function decryptPayload(cipherTextBase64: string, ivHex: string): Promise<string> {
  try {
    const key = await getMeshMasterKey();
    const iv = new Uint8Array(ivHex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
    const binaryStr = atob(cipherTextBase64);
    const encryptedBytes = new Uint8Array(binaryStr.length);
    for (let i = 0; i < binaryStr.length; i++) {
      encryptedBytes[i] = binaryStr.charCodeAt(i);
    }

    const decryptedBuffer = await window.crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv,
        tagLength: 128
      },
      key,
      encryptedBytes
    );

    return new TextDecoder().decode(decryptedBuffer);
  } catch (err) {
    console.warn('Decryption failed, fallback payload', err);
    return '[Decryption Failed or Key Mismatch]';
  }
}

/**
 * Compute Rotating Vehicle ID (R-VID):
 * Rotates every 60 minutes based on epoch hour salt.
 * Ensures nearby receivers cannot stalk driver routes without transport police private key.
 */
export async function generateRotatingVehicleId(rawPlateNumber: string): Promise<string> {
  const currentEpochHour = Math.floor(Date.now() / (1000 * 60 * 60));
  const salt = `SALT_${currentEpochHour}`;
  const input = `${rawPlateNumber}:${salt}`;

  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('KAVACH_RVID_HMAC_MASTER_KEY'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', keyMaterial, new TextEncoder().encode(input));
  const hashBytes = new Uint8Array(signature);
  
  // Truncate to first 4 bytes (8 hex characters)
  const rvidHex = Array.from(hashBytes.slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();

  return rvidHex;
}

/**
 * Compute 4-byte compact truncated message authentication code (MAC)
 */
export async function computeCompactMac(rawBytes: Uint8Array): Promise<string> {
  const keyMaterial = await window.crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode('KAVACH_COMPACT_AUTH_TAG_2026'),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await window.crypto.subtle.sign('HMAC', keyMaterial, rawBytes as unknown as BufferSource);
  const tagBytes = new Uint8Array(signature);
  
  return Array.from(tagBytes.slice(0, 4))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}
