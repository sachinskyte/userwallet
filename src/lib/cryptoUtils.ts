// Crypto helpers for PandoraVault (AES-GCM + signature-based key derivation)

export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length % 2) hex = "0" + hex;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++)
    out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
  return out;
}

export function uint8ArrayToBase64(u8: Uint8Array): string {
  return btoa(String.fromCharCode(...u8));
}

export function base64ToUint8Array(b64: string): Uint8Array {
  const bin = atob(b64);
  const arr = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
  return arr;
}

export async function deriveAesKeyFromSignature(sig) {
  const raw = new TextEncoder().encode(sig);
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    toBufferSource(raw),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: new TextEncoder().encode("pandora-vault"),
      iterations: 500000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  return uint8ArrayToBase64(raw);
}

export async function importKeyFromBase64(b64: string): Promise<CryptoKey> {
  const raw = base64ToUint8Array(b64);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, [
    "encrypt",
    "decrypt",
  ]);
}

export function toBufferSource(u8) {
  if (u8.buffer instanceof ArrayBuffer) return u8;
  const copy = new Uint8Array(u8.length);
  for (let i = 0; i < u8.length; i++) copy[i] = u8[i];
  return copy;
}

export async function encryptAES(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(data);
  const safeIv = toBufferSource(iv);
  const safeData = toBufferSource(encoded);

  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: safeIv },
    key,
    safeData
  );

  return {
    iv: uint8ArrayToBase64(new Uint8Array(safeIv)),
    data: uint8ArrayToBase64(new Uint8Array(encrypted)),
  };
}

export async function decryptAES(key, encrypted) {
  const iv = base64ToUint8Array(encrypted.iv);
  const enc = base64ToUint8Array(encrypted.data);

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: toBufferSource(iv) },
    key,
    toBufferSource(enc)
  );
  return new TextDecoder().decode(decrypted);
}
