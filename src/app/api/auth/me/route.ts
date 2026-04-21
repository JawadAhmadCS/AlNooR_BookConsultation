import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/auth-session";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({
    id: s.sub,
    username: s.username,
    role: s.role,
  });
}
