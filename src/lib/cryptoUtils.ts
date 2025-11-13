// Crypto helpers for PandoraVault (AES-GCM + signature-based key derivation)

export function hexToUint8Array(hex: string): Uint8Array {
  if (hex.startsWith("0x")) hex = hex.slice(2);
  if (hex.length % 2) hex = "0" + hex;
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substring(i * 2, i * 2 + 2), 16);
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

export async function deriveAesKeyFromSignature(signature: string): Promise<CryptoKey> {
  const sigBytes = hexToUint8Array(signature);
  const hash = await crypto.subtle.digest("SHA-256", sigBytes);
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

export async function exportKeyToBase64(key: CryptoKey): Promise<string> {
  const raw = new Uint8Array(await crypto.subtle.exportKey("raw", key));
  return uint8ArrayToBase64(raw);
}

export async function importKeyFromBase64(b64: string): Promise<CryptoKey> {
  const raw = base64ToUint8Array(b64);
  return crypto.subtle.importKey("raw", raw, { name: "AES-GCM" }, true, ["encrypt", "decrypt"]);
}

export async function aesEncrypt(key: CryptoKey, plaintext: string): Promise<{ iv: string; ct: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded));
  return {
    iv: uint8ArrayToBase64(iv),
    ct: uint8ArrayToBase64(ct),
  };
}

export async function aesDecrypt(key: CryptoKey, ivB64: string, ctB64: string): Promise<string> {
  const iv = base64ToUint8Array(ivB64);
  const ct = base64ToUint8Array(ctB64);
  const pt = new Uint8Array(await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct));
  return new TextDecoder().decode(pt);
}

