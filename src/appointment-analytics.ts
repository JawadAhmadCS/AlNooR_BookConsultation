import type { Appointment } from "@/bookings";

/** Normalize various date strings to YYYY-MM-DD when possible (generic, not tied to one format). */
export function normalizeDayKey(raw: string): string | null {
  const s = (raw || "").trim();
  if (!s) return null;
  const iso = /^\d{4}-\d{2}-\d{2}/.exec(s);
  if (iso) return iso[0];
  const d = Date.parse(s);
  if (Number.isNaN(d)) return s.slice(0, 32);
  const x = new Date(d);
  const y = x.getFullYear();
  const m = String(x.getMonth() + 1).padStart(2, "0");
  const day = String(x.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export type AppointmentAnalytics = {
  total: number;
  generatedAt: string;
  /** Dynamic keys as they appear in data */
  byStatus: Record<string, number>;
  byCity: Record<string, number>;
  /** Top services by volume */
  topServices: { name: string; count: number }[];
  /** Appointments per calendar day key */
  byDay: Record<string, number>;
  /** Recent created-at timeline (bucket by day of record creation) */
  createdByDay: Record<string, number>;
};

export function computeAppointmentAnalytics(
  appointments: Appointment[]
): AppointmentAnalytics {
  const byStatus: Record<string, number> = {};
  const byCity: Record<string, number> = {};
  const byService: Record<string, number> = {};
  const byDay: Record<string, number> = {};
  const createdByDay: Record<string, number> = {};

  for (const a of appointments) {
    const st = (a.status || "unknown").trim() || "unknown";
    byStatus[st] = (byStatus[st] || 0) + 1;

    const city = (a.city || "").trim() || "Unknown";
    byCity[city] = (byCity[city] || 0) + 1;

    const svc = (a.service || "").trim() || "Unknown";
    byService[svc] = (byService[svc] || 0) + 1;

    const dk = normalizeDayKey(a.date);
    if (dk) byDay[dk] = (byDay[dk] || 0) + 1;

    try {
      const c = new Date(a.createdAt);
      if (!Number.isNaN(c.getTime())) {
        const key = c.toISOString().slice(0, 10);
        createdByDay[key] = (createdByDay[key] || 0) + 1;
      }
    } catch {
      /* ignore */
    }
  }

  const topServices = Object.entries(byService)
    .sort((x, y) => y[1] - x[1])
    .slice(0, 20)
    .map(([name, count]) => ({ name, count }));

  return {
    total: appointments.length,
    generatedAt: new Date().toISOString(),
    byStatus,
    byCity,
    topServices,
    byDay,
    createdByDay,
  };
}
