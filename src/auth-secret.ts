export function getAuthSecret(): Uint8Array {
  const s = process.env.AUTH_SECRET;
  if (s && s.length >= 16) return new TextEncoder().encode(s);
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET must be set (min 16 chars) in production");
  }
  return new TextEncoder().encode("dev-insecure-auth-secret-min-32-chars!!");
}
