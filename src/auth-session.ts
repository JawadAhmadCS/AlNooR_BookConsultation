import { SignJWT } from "jose/jwt/sign";
import type { NextRequest } from "next/server";
import { getAuthSecret } from "@/auth-secret";
import {
  SESSION_COOKIE_NAME,
  verifySessionToken,
  type SessionPayload,
} from "@/session-verify";

export type { SessionPayload };

export async function signSession(p: SessionPayload): Promise<string> {
  const secret = getAuthSecret();
  return new SignJWT({
    username: p.username,
    role: p.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(p.sub)
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

export async function getSessionFromRequest(
  req: NextRequest
): Promise<SessionPayload | null> {
  const raw = req.cookies.get(SESSION_COOKIE_NAME)?.value;
  if (!raw) return null;
  return verifySessionToken(raw);
}

export { SESSION_COOKIE_NAME, verifySessionToken };

export function sessionCookieOptions(maxAgeSec: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: maxAgeSec,
  };
}
