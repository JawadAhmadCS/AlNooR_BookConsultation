import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/auth-session";
import { canManageUsers } from "@/roles";
import {
  deleteDashboardUser,
  updateDashboardUser,
} from "@/users";
import type { NextRequest } from "next/server";
import type { Role } from "@/roles";

export const runtime = "nodejs";

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getSessionFromRequest(req);
  if (!s || !canManageUsers(s.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  let body: { password?: string; role?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const updates: { password?: string; role?: Role } = {};
  if (typeof body.password === "string" && body.password.length > 0) {
    updates.password = body.password;
  }
  if (typeof body.role === "string") {
    updates.role = body.role as Role;
  }
  if (!updates.password && !updates.role) {
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
  }
  if (updates.role !== undefined && id === s.sub) {
    return NextResponse.json(
      { error: "You cannot change your own role" },
      { status: 400 }
    );
  }
  const out = await updateDashboardUser(id, updates);
  if (out === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (out === "last_superadmin") {
    return NextResponse.json(
      { error: "Cannot remove the last super admin role" },
      { status: 400 }
    );
  }
  return NextResponse.json(out);
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  const s = await getSessionFromRequest(req);
  if (!s || !canManageUsers(s.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const { id } = await ctx.params;
  const r = await deleteDashboardUser(id, s.sub);
  if (r === "not_found") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (r === "forbidden") {
    return NextResponse.json({ error: "Cannot delete your own account" }, { status: 400 });
  }
  if (r === "last_superadmin") {
    return NextResponse.json(
      { error: "Cannot delete the last super admin" },
      { status: 400 }
    );
  }
  return NextResponse.json({ ok: true });
}
