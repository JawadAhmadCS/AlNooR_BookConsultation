/**
 * JWT verify only — safe to import from Edge middleware (`jose/jwt/verify` avoids JWE deflate).
 */
import { jwtVerify } from "jose/jwt/verify";
import { getAuthSecret } from "@/auth-secret";
import type { Role } from "@/roles";

export const SESSION_COOKIE_NAME = "alnoor_session";

export type SessionPayload = {
  sub: string;
  username: string;
  role: Role;
};

export async function verifySessionToken(
  token: string
): Promise<SessionPayload | null> {
  try {
    const secret = getAuthSecret();
    const { payload } = await jwtVerify(token, secret);
    const sub = typeof payload.sub === "string" ? payload.sub : "";
    const username =
      typeof payload.username === "string" ? payload.username : "";
    const role = payload.role as Role;
    if (!sub || !username) return null;
    if (role !== "superadmin" && role !== "admin" && role !== "viewer")
      return null;
    return { sub, username, role };
  } catch {
    return null;
  }
}
