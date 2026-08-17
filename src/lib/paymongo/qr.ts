/** Normalize PayMongo QR image payloads for <img src> / download. */
export function normalizeQrSrc(url: string) {
  const value = url.trim();
  if (!value) return "";
  if (value.startsWith("data:") || value.startsWith("http")) return value;
  return `data:image/png;base64,${value}`;
}
