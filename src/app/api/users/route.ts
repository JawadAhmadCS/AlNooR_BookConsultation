import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/auth-session";
import { canManageUsers } from "@/roles";
import {
  createDashboardUser,
  listDashboardUsers,
} from "@/users";
import type { NextRequest } from "next/server";
import type { Role } from "@/roles";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || !canManageUsers(s.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const users = await listDashboardUsers();
  return NextResponse.json(users);
}

export async function POST(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s || !canManageUsers(s.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  let body: { username?: string; password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const username = typeof body.username === "string" ? body.username : "";
  const password = typeof body.password === "string" ? body.password : "";
  const role = (typeof body.role === "string" ? body.role : "") as Role;
  if (!username || !password) {
    return NextResponse.json(
      { error: "username and password required" },
      { status: 400 }
    );
  }
  const out = await createDashboardUser({ username, password, role });
  if (out === "duplicate") {
    return NextResponse.json({ error: "Username already exists" }, { status: 409 });
  }
  if (out === "bad_role") {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }
  return NextResponse.json(out, { status: 201 });
}
