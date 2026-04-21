import { NextResponse } from "next/server";
import { getSessionFromRequest } from "@/auth-session";
import { listAppointments } from "@/bookings";
import { computeAppointmentAnalytics } from "@/appointment-analytics";
import { canUseSuperFeatures } from "@/roles";
import type { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const s = await getSessionFromRequest(req);
  if (!s) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!canUseSuperFeatures(s.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const appointments = await listAppointments();
  return NextResponse.json(computeAppointmentAnalytics(appointments));
}
