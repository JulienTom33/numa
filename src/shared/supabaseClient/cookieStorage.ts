const MAX_AGE_SECONDS = 60 * 60 * 24 * 400;
const CHUNK_ENCODED_LENGTH = 3000;
const CHUNKED_MARKER = "__chunks:";

export interface CookieOptions {
  maxAgeSeconds?: number;
}

function isSecureContext(): boolean {
  return window.location.protocol === "https:";
}

export function readCookie(name: string): string | null {
  const target = encodeURIComponent(name);
  for (const part of document.cookie.split("; ")) {
    const separator = part.indexOf("=");
    if (separator === -1) continue;
    if (part.slice(0, separator) === target) {
      try {
        return decodeURIComponent(part.slice(separator + 1));
      } catch {
        return null;
      }
    }
  }
  return null;
}

export function writeCookie(name: string, value: string, options: CookieOptions = {}): void {
  const { maxAgeSeconds = MAX_AGE_SECONDS } = options;
  const attributes = ["Path=/", `Max-Age=${maxAgeSeconds}`, "SameSite=Lax"];
  if (isSecureContext()) attributes.push("Secure");
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; ${attributes.join("; ")}`;
}

export function deleteCookie(name: string): void {
  const attributes = ["Path=/", "Max-Age=0", "SameSite=Lax"];
  if (isSecureContext()) attributes.push("Secure");
  document.cookie = `${encodeURIComponent(name)}=; ${attributes.join("; ")}`;
}

function splitForCookies(value: string): string[] {
  const chunks: string[] = [];
  let current = "";
  let currentLength = 0;
  for (const character of value) {
    const encodedLength = encodeURIComponent(character).length;
    if (currentLength + encodedLength > CHUNK_ENCODED_LENGTH) {
      chunks.push(current);
      current = "";
      currentLength = 0;
    }
    current += character;
    currentLength += encodedLength;
  }
  chunks.push(current);
  return chunks;
}

function chunkName(key: string, index: number): string {
  return `${key}.${index}`;
}

function chunkCount(marker: string): number {
  const count = Number.parseInt(marker.slice(CHUNKED_MARKER.length), 10);
  return Number.isNaN(count) ? 0 : count;
}

function deleteChunks(key: string): void {
  const marker = readCookie(key);
  if (marker === null || !marker.startsWith(CHUNKED_MARKER)) return;
  for (let index = 0; index < chunkCount(marker); index += 1) {
    deleteCookie(chunkName(key, index));
  }
}

function readLegacy(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeLegacy(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    return;
  }
}

function readStored(key: string): string | null {
  const stored = readCookie(key);
  if (stored === null || !stored.startsWith(CHUNKED_MARKER)) return stored;
  let value = "";
  for (let index = 0; index < chunkCount(stored); index += 1) {
    const chunk = readCookie(chunkName(key, index));
    if (chunk === null) return null;
    value += chunk;
  }
  return value;
}

export const cookieStorage = {
  getItem(key: string): string | null {
    const stored = readStored(key);
    if (stored !== null) return stored;
    const legacy = readLegacy(key);
    if (legacy === null) return null;
    cookieStorage.setItem(key, legacy);
    return legacy;
  },
  setItem(key: string, value: string): void {
    deleteChunks(key);
    const chunks = splitForCookies(value);
    if (chunks.length === 1) {
      writeCookie(key, value);
    } else {
      chunks.forEach((chunk, index) => writeCookie(chunkName(key, index), chunk));
      writeCookie(key, `${CHUNKED_MARKER}${chunks.length}`);
    }
    removeLegacy(key);
  },
  removeItem(key: string): void {
    deleteChunks(key);
    deleteCookie(key);
    removeLegacy(key);
  },
};
