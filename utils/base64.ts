export function base64toBase64Url(s: string) {
  return s.replace(/\=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export function base64UrlToBase64(s: string) {
  const base64 = s.replace(/_/g, "/").replace(/-/g, "+");
  const lengthMod4 = base64.length % 4;
  const length = lengthMod4 ? base64.length + (4 - lengthMod4) : base64.length;
  return base64.padEnd(length, "=");
}

export function bytesToBase64(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  const chars: string[] = new Array(bytes.length);

  for (let i = 0; i < bytes.length; i++) {
    chars[i] = String.fromCharCode(bytes[i]);
  }

  return btoa(chars.join(""));
}

export function bytesToBase64Url(arrayBuffer: ArrayBuffer) {
  const base64 = bytesToBase64(arrayBuffer);
  return base64toBase64Url(base64);
}

export function base64ToBytes(base64String: string): Uint8Array {
  const codes: number[] = atob(base64String)
    .split("")
    .map((char) => char.charCodeAt(0));

  const bytes = new Uint8Array(codes.length);

  for (let i = 0; i < codes.length; i++) {
    bytes[i] = codes[i];
  }

  return bytes;
}

export function base64UrlToBytes(base64UrlString: string) {
  const base64 = base64UrlToBase64(base64UrlString);
  return base64ToBytes(base64);
}
