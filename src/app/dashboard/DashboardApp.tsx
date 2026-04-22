"use client";

import { BOOKING_ROUTES } from "@/config";
import {
  computeAppointmentAnalytics,
  normalizeDayKey,
} from "@/appointment-analytics";
import {
  canEditAppointments,
  canManageUsers,
  canViewCalendarAndAnalytics,
} from "@/roles";
import type { Role } from "@/roles";
import type { Appointment } from "@/bookings";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const dashCss = `
@import url("https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&display=swap");
.dash{min-height:100vh;background:radial-gradient(ellipse 120% 80% at 50% -20%,rgba(45,212,191,0.12),transparent 50%),linear-gradient(165deg,#070b10 0%,#0f1724 40%,#0a0f18 100%);color:#e8edf4;font-family:"DM Sans",system-ui,sans-serif;-webkit-font-smoothing:antialiased}
.dash .inner{max-width:1320px;margin:0 auto;padding:1.5rem 1.25rem 3rem}
.dash .heroBar{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:1.25rem;margin-bottom:1.5rem;padding:1.35rem 1.5rem;border-radius:18px;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(135deg,rgba(20,27,36,0.95),rgba(15,23,36,0.85));box-shadow:0 18px 50px rgba(0,0,0,0.35)}
.dash .top{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:1rem}
.dash .title{margin:0;font-size:1.75rem;font-weight:700;letter-spacing:-0.03em;background:linear-gradient(120deg,#5eead4,#7dd3fc,#c4b5fd);-webkit-background-clip:text;background-clip:text;color:transparent}
.dash .sub{margin:0.4rem 0 0;color:#94a3b8;font-size:0.95rem;max-width:44rem;line-height:1.55}
.dash .meta{color:#64748b;font-size:0.82rem;margin-top:0.35rem}
.dash .actions{display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center}
.dash .btn{padding:0.55rem 1.05rem;border-radius:11px;font-size:0.88rem;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(30,41,59,0.6);color:#e8edf4;transition:background .2s,border-color .2s,transform .15s}
.dash .btn:hover{background:rgba(51,65,85,0.55);border-color:rgba(94,234,212,0.25)}
.dash .btnPrimary{border:none;background:linear-gradient(135deg,#2dd4bf,#14b8a6);color:#042f2e;box-shadow:0 4px 20px rgba(45,212,191,0.25)}
.dash .btnPrimary:hover{transform:translateY(-1px);box-shadow:0 6px 24px rgba(45,212,191,0.35)}
.dash .link{color:#5eead4;text-decoration:none;font-size:0.9rem;font-weight:500}
.dash .link:hover{text-decoration:underline}
.dash .tabs{display:flex;flex-wrap:wrap;gap:0.4rem;margin-bottom:1.5rem;padding:0.35rem;border-radius:14px;background:rgba(15,23,42,0.5);border:1px solid rgba(255,255,255,0.06);width:fit-content;max-width:100%}
.dash .tab{padding:0.5rem 1.1rem;border-radius:10px;font-size:0.86rem;font-weight:600;cursor:pointer;border:1px solid transparent;background:transparent;color:#94a3b8;transition:color .2s,background .2s}
.dash .tab:hover{color:#cbd5e1}
.dash .tab.on{background:rgba(45,212,191,0.12);border-color:rgba(45,212,191,0.28);color:#5eead4}
.dash .error{color:#fecaca;margin:0 0 1rem;padding:0.85rem 1.1rem;border-radius:12px;background:rgba(127,29,29,0.25);border:1px solid rgba(248,113,113,0.25)}
.dash .panel{border-radius:18px;border:1px solid rgba(255,255,255,0.08);background:rgba(15,23,42,0.45);padding:1.35rem 1.5rem;margin-bottom:1.25rem;box-shadow:0 12px 40px rgba(0,0,0,0.2)}
.dash .panelHead{margin:0 0 0.35rem;font-size:1.1rem;font-weight:600;color:#f1f5f9;letter-spacing:-0.02em}
.dash .panelLead{margin:0 0 1.25rem;color:#94a3b8;font-size:0.88rem;line-height:1.5;max-width:52rem}
.dash .tableWrap{border-radius:14px;overflow:auto;border:1px solid rgba(255,255,255,0.07);background:rgba(12,17,24,0.55)}
.dash .table{width:100%;border-collapse:collapse;font-size:0.875rem}
.dash .th{text-align:left;padding:0.9rem 1rem;font-weight:600;color:#94a3b8;text-transform:uppercase;font-size:0.7rem;letter-spacing:0.07em;border-bottom:1px solid rgba(255,255,255,0.07);background:rgba(7,11,17,0.85)}
.dash .tr{border-bottom:1px solid rgba(255,255,255,0.04)}
.dash .tr:hover{background:rgba(45,212,191,0.03)}
.dash .td{padding:0.8rem 1rem;color:#e2e8f0}
.dash .tdMuted{padding:0.8rem 1rem;color:#94a3b8;font-size:0.82rem}
.dash .empty{padding:2.75rem 1.5rem;text-align:center;color:#64748b}
.dash .statusSelect{padding:0.45rem 0.6rem;border-radius:9px;border:1px solid rgba(255,255,255,0.1);background:#0f1724;color:#e8edf4;font-size:0.82rem;min-width:120px}
.dash .statusSelect:disabled{opacity:0.55;cursor:not-allowed}
.dash .rowActions{display:flex;flex-wrap:wrap;gap:0.4rem}
.dash .iconBtn{padding:0.4rem 0.75rem;border-radius:9px;font-size:0.78rem;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.1);background:rgba(30,41,59,0.5);color:#cbd5e1;transition:background .15s,border-color .15s}
.dash .iconBtn:hover{background:rgba(51,65,85,0.45);border-color:rgba(94,234,212,0.2)}
.dash .iconBtn:disabled{opacity:0.4;cursor:not-allowed}
.dash .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);display:grid;place-items:center;z-index:50;padding:1rem}
.dash .modal{width:100%;max-width:440px;border-radius:18px;border:1px solid rgba(255,255,255,0.1);background:#111827;padding:1.5rem 1.6rem;box-shadow:0 24px 80px rgba(0,0,0,0.55)}
.dash .modal h2{margin:0 0 1rem;font-size:1.12rem;color:#f8fafc}
.dash .field{margin-bottom:0.85rem}
.dash .field label{display:block;font-size:0.68rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:0.4rem}
.dash .field input,.dash .field select{width:100%;padding:0.6rem 0.7rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:#0c1117;color:#e8edf4;font-size:0.9rem}
.dash .modalActions{display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1.25rem}
.dash .calToolbar{display:flex;align-items:center;justify-content:space-between;gap:1rem;margin-bottom:1.25rem;flex-wrap:wrap}
.dash .calTitle{font-size:1.2rem;font-weight:700;color:#f1f5f9;letter-spacing:-0.02em}
.dash .calNavBtns{display:flex;gap:0.5rem}
.dash .calGrid{display:grid;grid-template-columns:repeat(7,1fr);gap:0.45rem;font-size:0.78rem}
.dash .calHead{color:#64748b;font-weight:600;text-align:center;padding:0.4rem 0.2rem;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.04em}
.dash .calCell{min-height:96px;border-radius:12px;border:1px solid rgba(255,255,255,0.06);background:rgba(12,17,24,0.65);padding:0.45rem;transition:border-color .2s,box-shadow .2s}
.dash .calCell.muted{opacity:0.25;min-height:72px}
.dash .calCell.today{border-color:rgba(45,212,191,0.45);box-shadow:0 0 0 1px rgba(45,212,191,0.15)}
.dash .calCell.hasAppts{background:rgba(45,212,191,0.04)}
.dash .calCell.calSelected{border-color:rgba(167,139,250,0.55);box-shadow:0 0 0 2px rgba(167,139,250,0.18)}
.dash .calCellBtn{all:unset;box-sizing:border-box;display:block;width:100%;min-height:96px;border-radius:12px;padding:0.45rem;cursor:pointer;text-align:left;transition:transform .12s}
.dash .calCellBtn:focus-visible{outline:2px solid rgba(45,212,191,0.6);outline-offset:2px}
.dash .calCellBtn:hover:not(:disabled){transform:scale(1.02)}
.dash .calCell.muted .calPlaceholder{min-height:72px}
.dash .calDayNum{display:flex;align-items:center;justify-content:space-between;margin-bottom:0.35rem}
.dash .calDay{font-weight:700;color:#e2e8f0;font-size:0.8rem}
.dash .calBadge{font-size:0.62rem;font-weight:700;padding:0.12rem 0.4rem;border-radius:6px;background:rgba(45,212,191,0.15);color:#5eead4}
.dash .calItem{font-size:0.68rem;color:#94a3b8;margin-top:0.22rem;padding:0.2rem 0.35rem;border-radius:6px;background:rgba(255,255,255,0.03);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash .statGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:1rem;margin-bottom:1.5rem}
.dash .statCard{border:1px solid rgba(255,255,255,0.08);border-radius:14px;padding:1.15rem 1.2rem;background:linear-gradient(145deg,rgba(30,41,59,0.5),rgba(15,23,42,0.4));position:relative;overflow:hidden}
.dash .statCard::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(45,212,191,0.06),transparent 60%);pointer-events:none}
.dash .statCard strong{position:relative;display:block;font-size:1.65rem;font-weight:700;color:#5eead4;letter-spacing:-0.02em}
.dash .statCard span{position:relative;font-size:0.82rem;color:#94a3b8;line-height:1.4}
.dash .analyticsSplit{display:grid;grid-template-columns:1fr 1fr;gap:1.5rem}
@media(max-width:900px){.dash .analyticsSplit{grid-template-columns:1fr}}
.dash .barBlock{margin-bottom:1.5rem}
.dash .barBlock h4{margin:0 0 0.75rem;font-size:0.82rem;font-weight:600;color:#cbd5e1;text-transform:uppercase;letter-spacing:0.06em}
.dash .barRow{display:flex;align-items:center;gap:0.55rem;margin-bottom:0.5rem;font-size:0.84rem}
.dash .barRow span:first-child{flex:0 0 36%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#cbd5e1}
.dash .barBg{flex:1;height:9px;border-radius:5px;background:rgba(255,255,255,0.05);overflow:hidden}
.dash .barFi{height:100%;background:linear-gradient(90deg,#2dd4bf,#38bdf8);border-radius:5px;transition:width .3s ease}
.dash .barCt{flex:0 0 2rem;text-align:right;font-weight:600;color:#94a3b8;font-size:0.8rem}
.dash .trendPanel{border-radius:16px;border:1px solid rgba(255,255,255,0.08);background:linear-gradient(165deg,rgba(15,23,42,0.92),rgba(10,14,22,0.72));padding:1.35rem 1.4rem 1.15rem;margin-bottom:1.5rem;overflow:hidden;box-shadow:inset 0 1px 0 rgba(255,255,255,0.04)}
.dash .trendHead{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1.1rem}
.dash .trendTitle{margin:0;font-size:1rem;font-weight:600;color:#f1f5f9}
.dash .trendControls{display:flex;flex-wrap:wrap;gap:0.9rem 1.1rem;align-items:flex-end}
.dash .granTabs{display:flex;gap:0.35rem;padding:0.28rem;border-radius:12px;background:rgba(7,11,17,0.55);border:1px solid rgba(255,255,255,0.06)}
.dash .granTab{padding:0.42rem 0.9rem;border-radius:9px;font-size:0.8rem;font-weight:600;border:1px solid transparent;background:transparent;color:#94a3b8;cursor:pointer;transition:background .15s,color .15s}
.dash .granTab:hover{color:#cbd5e1}
.dash .granTab.on{background:rgba(45,212,191,0.14);border-color:rgba(45,212,191,0.32);color:#5eead4}
.dash .datePair{display:flex;gap:0.65rem;flex-wrap:wrap;align-items:flex-end}
.dash .miniField label{display:block;font-size:0.62rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:0.32rem}
.dash .miniField input{padding:0.48rem 0.6rem;border-radius:10px;border:1px solid rgba(255,255,255,0.1);background:#0c1117;color:#e8edf4;font-size:0.85rem}
.dash .trendSvgWrap{width:100%;overflow-x:auto;padding:0.25rem 0}
.dash .trendSvg{min-width:280px;width:100%;height:auto;display:block}
.dash .trendFoot{display:flex;flex-wrap:wrap;justify-content:space-between;gap:0.5rem;margin-top:0.65rem;font-size:0.76rem;color:#64748b}
.dash .calDayDetail{margin-top:1.75rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.06)}
.dash .calDayDetail h3{margin:0 0 1rem;font-size:1.02rem;font-weight:600;color:#f1f5f9}
.dash .teamRow{display:flex;flex-wrap:wrap;align-items:flex-end;gap:1rem 1.25rem;margin-bottom:1.5rem}
.dash .teamField{flex:1 1 160px;min-width:140px}
.dash .teamField label{display:block;font-size:0.68rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:0.4rem}
.dash .teamField input,.dash .teamField select{width:100%;padding:0.62rem 0.75rem;border-radius:11px;border:1px solid rgba(255,255,255,0.1);background:#0c1117;color:#e8edf4;font-size:0.9rem;box-sizing:border-box}
.dash .teamField.roleField{flex:0 1 180px;min-width:160px}
.dash .teamSubmit{flex:0 0 auto;padding:0.62rem 1.35rem;border-radius:11px;border:none;background:linear-gradient(135deg,#2dd4bf,#14b8a6);color:#042f2e;font-weight:700;cursor:pointer;font-size:0.9rem;box-shadow:0 4px 18px rgba(45,212,191,0.25);height:42px;align-self:flex-end}
.dash .teamSubmit:hover{filter:brightness(1.05)}
.dash .rolePill{display:inline-flex;align-items:center;gap:0.35rem;padding:0.2rem 0.55rem;border-radius:999px;font-size:0.72rem;font-weight:600}
.dash .rolePill.you{background:rgba(56,189,248,0.12);color:#7dd3fc;border:1px solid rgba(56,189,248,0.25)}
.dash .userCell{display:flex;align-items:center;gap:0.5rem;flex-wrap:wrap}
`;

type Status = "pending" | "confirmed" | "cancelled";
type Tab = "list" | "calendar" | "analytics" | "team";

const STATUSES: Status[] = ["pending", "confirmed", "cancelled"];

type Me = { id: string; username: string; role: Role };

type TeamUser = { id: string; username: string; role: Role; createdAt: string };

const ALL_ROLES: Role[] = ["viewer", "admin", "superadmin"];

function roleLabel(r: Role): string {
  if (r === "superadmin") return "Super Admin";
  if (r === "admin") return "Admin";
  return "Viewer";
}

function formatCreatedAt(iso: string) {
  try {
    return new Date(iso).toLocaleString(undefined, {
      dateStyle: "medium",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}

function labelStatus(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

type ChartGranularity = "week" | "month" | "year";

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function parseYMD(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s.trim());
  if (!m) return null;
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (
    dt.getFullYear() !== y ||
    dt.getMonth() !== mo - 1 ||
    dt.getDate() !== d
  )
    return null;
  return dt;
}

function weekStartSunday(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() - x.getDay());
  return x;
}

function addDays(d: Date, n: number): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  x.setDate(x.getDate() + n);
  return x;
}

function formatWeekLabel(ws: Date): string {
  const we = addDays(ws, 6);
  const o: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
  return `${ws.toLocaleDateString(undefined, o)} – ${we.toLocaleDateString(undefined, o)}`;
}

function buildAppointmentTrend(
  appointments: Appointment[],
  mode: ChartGranularity,
  fromStr: string,
  toStr: string
): { key: string; label: string; count: number }[] {
  const fromD = parseYMD(fromStr);
  const toD = parseYMD(toStr);
  if (!fromD || !toD) return [];
  const from = fromD > toD ? toD : fromD;
  const to = fromD > toD ? fromD : toD;
  const fromK = `${from.getFullYear()}-${pad2(from.getMonth() + 1)}-${pad2(from.getDate())}`;
  const toK = `${to.getFullYear()}-${pad2(to.getMonth() + 1)}-${pad2(to.getDate())}`;

  const inRange = appointments.filter((a) => {
    const dk = normalizeDayKey(a.date);
    return dk && dk >= fromK && dk <= toK;
  });

  if (mode === "year") {
    const counts: Record<string, number> = {};
    for (const a of inRange) {
      const dk = normalizeDayKey(a.date);
      if (!dk) continue;
      const y = dk.slice(0, 4);
      counts[y] = (counts[y] || 0) + 1;
    }
    const y0 = from.getFullYear();
    const y1 = to.getFullYear();
    const out: { key: string; label: string; count: number }[] = [];
    for (let y = y0; y <= y1; y++) {
      const ys = String(y);
      out.push({ key: ys, label: ys, count: counts[ys] || 0 });
    }
    return out;
  }

  if (mode === "month") {
    const counts: Record<string, number> = {};
    for (const a of inRange) {
      const dk = normalizeDayKey(a.date);
      if (!dk) continue;
      const mk = dk.slice(0, 7);
      counts[mk] = (counts[mk] || 0) + 1;
    }
    const out: { key: string; label: string; count: number }[] = [];
    const cur = new Date(from.getFullYear(), from.getMonth(), 1);
    const last = new Date(to.getFullYear(), to.getMonth(), 1);
    while (cur.getTime() <= last.getTime()) {
      const mk = `${cur.getFullYear()}-${pad2(cur.getMonth() + 1)}`;
      out.push({
        key: mk,
        label: new Date(
          cur.getFullYear(),
          cur.getMonth(),
          1
        ).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
        count: counts[mk] || 0,
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return out;
  }

  const counts: Record<string, number> = {};
  for (const a of inRange) {
    const dk = normalizeDayKey(a.date);
    if (!dk) continue;
    const d = parseYMD(dk);
    if (!d) continue;
    const ws = weekStartSunday(d);
    const wk = `${ws.getFullYear()}-${pad2(ws.getMonth() + 1)}-${pad2(ws.getDate())}`;
    counts[wk] = (counts[wk] || 0) + 1;
  }
  let ws = weekStartSunday(from);
  const lastWs = weekStartSunday(to);
  const out: { key: string; label: string; count: number }[] = [];
  while (ws.getTime() <= lastWs.getTime()) {
    const wk = `${ws.getFullYear()}-${pad2(ws.getMonth() + 1)}-${pad2(ws.getDate())}`;
    out.push({
      key: wk,
      label: formatWeekLabel(ws),
      count: counts[wk] || 0,
    });
    ws = addDays(ws, 7);
  }
  return out;
}

function compareAppointmentTime(a: Appointment, b: Appointment): number {
  const ka = timeSortKey(a.time);
  const kb = timeSortKey(b.time);
  if (ka !== kb) return ka - kb;
  return a.name.localeCompare(b.name);
}

function timeSortKey(t: string): number {
  const s = (t || "").trim();
  if (!s) return 0;
  const d1 = Date.parse(`1970-01-01 ${s}`);
  if (!Number.isNaN(d1)) return d1;
  const d2 = Date.parse(`1970-01-01T${s}`);
  if (!Number.isNaN(d2)) return d2;
  return 0;
}

function defaultChartFrom(): string {
  const d = new Date();
  d.setMonth(d.getMonth() - 5);
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-01`;
}

function todayYMD(): string {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

type TrendPoint = { key: string; label: string; count: number };

function TrendChart({ uid, series }: { uid: string; series: TrendPoint[] }) {
  const W = 800;
  const H = 280;
  const padL = 48;
  const padR = 20;
  const padT = 22;
  const padB = 58;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const n = series.length;
  const max = Math.max(1, ...series.map((s) => s.count));

  const gradId = `trend-grad-${uid}`;
  const glowId = `trend-glow-${uid}`;

  if (n === 0) {
    return (
      <p className="meta" style={{ margin: "1rem 0", textAlign: "center" }}>
        No appointments in this date range. Adjust the from / to dates.
      </p>
    );
  }

  const pts = series.map((t, i) => {
    const x =
      n <= 1 ? padL + plotW / 2 : padL + (i / Math.max(1, n - 1)) * plotW;
    const y = padT + plotH - (t.count / max) * plotH;
    return { x, y, ...t };
  });

  const bottomY = padT + plotH;
  let areaD: string;
  if (pts.length === 1) {
    const bw = 28;
    const p0 = pts[0];
    areaD = `M ${p0.x - bw / 2},${bottomY} L ${p0.x - bw / 2},${p0.y} L ${p0.x + bw / 2},${p0.y} L ${p0.x + bw / 2},${bottomY} Z`;
  } else {
    areaD =
      `M ${pts[0].x},${bottomY} L ` +
      pts.map((p) => `${p.x},${p.y}`).join(" L ") +
      ` L ${pts[pts.length - 1].x},${bottomY} Z`;
  }

  const lineD =
    pts.length <= 1
      ? ""
      : pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");

  const gridEls = [];
  for (let g = 0; g <= 4; g++) {
    const gy = padT + (g / 4) * plotH;
    gridEls.push(
      <line
        key={g}
        x1={padL}
        x2={padL + plotW}
        y1={gy}
        y2={gy}
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={1}
      />
    );
  }

  const labelStep = Math.max(1, Math.ceil(n / 12));
  const labelPts = pts.filter(
    (_, i) => i % labelStep === 0 || i === n - 1
  );

  const shortLabel = (s: string) =>
    s.length > 26 ? `${s.slice(0, 24)}…` : s;

  return (
    <div className="trendSvgWrap">
      <svg
        className="trendSvg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="xMidYMid meet"
        aria-label="Appointment volume trend chart"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#2dd4bf" stopOpacity={0.45} />
            <stop offset="55%" stopColor="#38bdf8" stopOpacity={0.12} />
            <stop offset="100%" stopColor="#0f1724" stopOpacity={0} />
          </linearGradient>
          <filter id={glowId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur stdDeviation="1.8" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {gridEls}
        <path d={areaD} fill={`url(#${gradId})`} stroke="none" />
        {lineD ? (
          <path
            d={lineD}
            fill="none"
            stroke="#5eead4"
            strokeWidth={2.75}
            strokeLinecap="round"
            strokeLinejoin="round"
            filter={`url(#${glowId})`}
          />
        ) : null}
        {pts.map((p) => (
          <circle
            key={p.key}
            cx={p.x}
            cy={p.y}
            r={pts.length === 1 ? 5 : 4}
            fill="#0b1220"
            stroke="#5eead4"
            strokeWidth={2}
          />
        ))}
        {labelPts.map((p) => (
          <text
            key={`lbl-${p.key}`}
            x={p.x}
            y={H - 14}
            fill="#94a3b8"
            fontSize={10}
            fontFamily="inherit"
            textAnchor="middle"
            transform={`rotate(-28 ${p.x} ${H - 14})`}
          >
            {shortLabel(p.label)}
          </text>
        ))}
        <text x={padL - 8} y={padT + 5} fill="#64748b" fontSize={11}>
          {max}
        </text>
        <text x={padL - 8} y={bottomY + 4} fill="#64748b" fontSize={11}>
          0
        </text>
      </svg>
    </div>
  );
}

const emptyForm = {
  name: "",
  phone: "",
  service: "",
  date: "",
  time: "",
  city: "",
  status: "pending" as Status,
};

export default function DashboardApp() {
  const router = useRouter();
  const [me, setMe] = useState<Me | null>(null);
  const [rows, setRows] = useState<Appointment[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editRow, setEditRow] = useState<Appointment | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [tab, setTab] = useState<Tab>("list");
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const [selectedCalKey, setSelectedCalKey] = useState<string>(() =>
    todayYMD()
  );
  const [chartGranularity, setChartGranularity] =
    useState<ChartGranularity>("month");
  const [chartFrom, setChartFrom] = useState(() => defaultChartFrom());
  const [chartTo, setChartTo] = useState(() => todayYMD());
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "viewer" as Role,
  });

  const canEdit = me ? canEditAppointments(me.role) : false;
  const insightsAccess = me ? canViewCalendarAndAnalytics(me.role) : false;
  const manageTeam = me ? canManageUsers(me.role) : false;

  const fetchOpts: RequestInit = { credentials: "include", cache: "no-store" };

  const loadMe = useCallback(async () => {
    const res = await fetch("/api/auth/me", fetchOpts);
    if (res.status === 401) {
      router.replace("/login");
      return;
    }
    if (!res.ok) throw new Error("Session error");
    setMe((await res.json()) as Me);
  }, [router]);

  const loadRows = useCallback(async () => {
    try {
      const res = await fetch(BOOKING_ROUTES.list, fetchOpts);
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as Appointment[];
      setRows(Array.isArray(data) ? data : []);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    }
  }, [router]);

  const loadTeam = useCallback(async () => {
    if (!manageTeam) return;
    try {
      const res = await fetch("/api/users", fetchOpts);
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error("Failed to load team");
      setTeamUsers((await res.json()) as TeamUser[]);
    } catch {
      setTeamUsers([]);
    }
  }, [manageTeam, router]);

  useEffect(() => {
    loadMe();
  }, [loadMe]);

  useEffect(() => {
    if (me) loadRows();
  }, [me, loadRows]);

  useEffect(() => {
    const t = setInterval(() => {
      loadRows();
    }, BOOKING_ROUTES.pollMs);
    return () => clearInterval(t);
  }, [loadRows]);

  useEffect(() => {
    if (tab === "team" && manageTeam) loadTeam();
  }, [tab, manageTeam, loadTeam]);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" });
    router.replace("/login");
    router.refresh();
  }

  const analytics = useMemo(
    () => computeAppointmentAnalytics(rows),
    [rows]
  );

  const byDayMap = useMemo(() => {
    const m: Record<string, Appointment[]> = {};
    for (const r of rows) {
      const k = normalizeDayKey(r.date);
      if (!k) continue;
      if (!m[k]) m[k] = [];
      m[k].push(r);
    }
    return m;
  }, [rows]);

  const cal = useMemo(() => {
    const y = viewMonth.getFullYear();
    const m = viewMonth.getMonth();
    const firstDow = new Date(y, m, 1).getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: { day: number | null; key: string | null }[] = [];
    for (let i = 0; i < firstDow; i++) cells.push({ day: null, key: null });
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      cells.push({ day: d, key });
    }
    return {
      cells,
      label: viewMonth.toLocaleString(undefined, {
        month: "long",
        year: "numeric",
      }),
    };
  }, [viewMonth]);

  const todayKey = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  }, []);

  const maxBarStatus = useMemo(
    () => Math.max(1, ...Object.values(analytics.byStatus)),
    [analytics.byStatus]
  );

  const selectedDayAppointments = useMemo(() => {
    const list = byDayMap[selectedCalKey] || [];
    return [...list].sort(compareAppointmentTime);
  }, [byDayMap, selectedCalKey]);

  const appointmentTrend = useMemo(
    () =>
      buildAppointmentTrend(
        rows,
        chartGranularity,
        chartFrom,
        chartTo
      ),
    [rows, chartGranularity, chartFrom, chartTo]
  );

  const chartUid = useId().replace(/:/g, "");

  function openEdit(r: Appointment) {
    if (!canEdit) return;
    setEditRow(r);
    setForm({
      name: r.name,
      phone: r.phone,
      service: r.service,
      date: r.date,
      time: r.time,
      city: r.city,
      status: r.status,
    });
  }

  function closeEdit() {
    setEditRow(null);
    setForm(emptyForm);
  }

  async function saveEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!editRow || !canEdit) return;
    setBusyId(editRow.id);
    setError(null);
    try {
      const res = await fetch(BOOKING_ROUTES.item(editRow.id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          service: form.service.trim(),
          date: form.date.trim(),
          time: form.time.trim(),
          city: form.city.trim(),
          status: form.status,
        }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (res.status === 403) {
        setError("You do not have permission to edit");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      closeEdit();
      await loadRows();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onStatusChange(id: string, status: Status) {
    if (!canEdit) return;
    setBusyId(id);
    try {
      const res = await fetch(BOOKING_ROUTES.item(id), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ status }),
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      await loadRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusyId(null);
    }
  }

  async function onDelete(id: string, name: string) {
    if (!canEdit) return;
    if (!confirm(`Delete appointment for “${name}”? This cannot be undone.`))
      return;
    setBusyId(id);
    try {
      const res = await fetch(BOOKING_ROUTES.item(id), {
        method: "DELETE",
        credentials: "include",
      });
      if (res.status === 401) {
        router.replace("/login");
        return;
      }
      if (!res.ok) throw new Error(await res.text());
      await loadRows();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setBusyId(null);
    }
  }

  async function addTeamUser(e: React.FormEvent) {
    e.preventDefault();
    if (!newUser.username.trim() || !newUser.password) return;
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        username: newUser.username.trim(),
        password: newUser.password,
        role: newUser.role,
      }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || "Could not create user");
      return;
    }
    setNewUser({ username: "", password: "", role: "viewer" as Role });
    await loadTeam();
  }

  async function deleteTeamUser(id: string, username: string) {
    if (!confirm(`Remove user “${username}”?`)) return;
    const res = await fetch(`/api/users/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || "Delete failed");
      return;
    }
    await loadTeam();
  }

  async function changeTeamRole(id: string, role: Role) {
    if (me && id === me.id) return;
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ role }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || "Update failed");
      return;
    }
    await loadTeam();
  }

  async function resetTeamPassword(id: string, username: string) {
    const pw = window.prompt(`New password for ${username}?`);
    if (!pw || pw.length < 4) return;
    const res = await fetch(`/api/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ password: pw }),
    });
    if (!res.ok) {
      const j = (await res.json().catch(() => ({}))) as { error?: string };
      setError(j.error || "Could not update password");
      return;
    }
    await loadTeam();
  }

  if (!me) {
    return (
      <div className="dash">
        <style dangerouslySetInnerHTML={{ __html: dashCss }} />
        <div className="inner">
          <p className="sub">Loading session…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dash">
      <style dangerouslySetInnerHTML={{ __html: dashCss }} />
      <div className="inner">
        <header className="heroBar">
          <div className="top" style={{ flex: 1, minWidth: 0 }}>
            <h1 className="title">Appointments dashboard</h1>
            <p className="sub">
              Signed in as <strong>{me.username}</strong> ·{" "}
              <span style={{ color: "#5eead4" }}>{roleLabel(me.role)}</span>.
              Public bookings post to{" "}
              <code style={{ color: "#7dd3fc", fontSize: "0.86em" }}>
                {BOOKING_ROUTES.create}
              </code>
            </p>
            <p className="meta">
              Table refreshes every {BOOKING_ROUTES.pollMs / 1000}s · Al Noor
              Care Hospital
            </p>
          </div>
          <div className="actions">
            <button type="button" className="btnPrimary" onClick={() => loadRows()}>
              Refresh data
            </button>
            <a className="link" href="/">
              Hospital site
            </a>
            <button type="button" className="btn" onClick={() => logout()}>
              Log out
            </button>
          </div>
        </header>

        <div className="tabs" role="tablist">
          <button
            type="button"
            className={`tab ${tab === "list" ? "on" : ""}`}
            onClick={() => setTab("list")}
          >
            List view
          </button>
          {insightsAccess ? (
            <>
              <button
                type="button"
                className={`tab ${tab === "calendar" ? "on" : ""}`}
                onClick={() => setTab("calendar")}
              >
                Calendar
              </button>
              <button
                type="button"
                className={`tab ${tab === "analytics" ? "on" : ""}`}
                onClick={() => setTab("analytics")}
              >
                Analytics
              </button>
            </>
          ) : null}
          {manageTeam ? (
            <button
              type="button"
              className={`tab ${tab === "team" ? "on" : ""}`}
              onClick={() => setTab("team")}
            >
              Team & roles
            </button>
          ) : null}
        </div>

        {error ? (
          <p className="error" role="alert">
            {error}
          </p>
        ) : null}

        {tab === "list" ? (
          <div className="tableWrap">
            <table className="table">
              <thead>
                <tr>
                  {[
                    "Name",
                    "Phone",
                    "Service",
                    "Date",
                    "Time",
                    "City",
                    "Created",
                    "Status",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className="th">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="empty">
                      No bookings yet. The public booking channel posts to{" "}
                      <code>{BOOKING_ROUTES.create}</code>.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr key={r.id} className="tr">
                      <td className="td">{r.name}</td>
                      <td className="td">{r.phone}</td>
                      <td className="td">{r.service}</td>
                      <td className="td">{r.date}</td>
                      <td className="td">{r.time}</td>
                      <td className="td">{r.city}</td>
                      <td className="tdMuted">{formatCreatedAt(r.createdAt)}</td>
                      <td className="td">
                        <select
                          aria-label={`Status for ${r.name}`}
                          className="statusSelect"
                          value={r.status}
                          disabled={busyId === r.id || !canEdit}
                          onChange={(e) =>
                            onStatusChange(r.id, e.target.value as Status)
                          }
                        >
                          {STATUSES.map((s) => (
                            <option key={s} value={s}>
                              {labelStatus(s)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="td">
                        <div className="rowActions">
                          <button
                            type="button"
                            className="iconBtn"
                            disabled={busyId === r.id || !canEdit}
                            onClick={() => openEdit(r)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="iconBtn"
                            disabled={busyId === r.id || !canEdit}
                            style={{
                              borderColor: "rgba(248,113,113,0.35)",
                              color: "#fca5a5",
                            }}
                            onClick={() => onDelete(r.id, r.name)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}

        {tab === "calendar" && insightsAccess ? (
          <div className="panel">
            <h2 className="panelHead">Appointment calendar</h2>
            <p className="panelLead">
              Click a date to see every booking for that day below the grid.
              Use arrows to change months. Today is highlighted; days with
              visits show a count badge.
            </p>
            <div className="calToolbar">
              <div className="calTitle">{cal.label}</div>
              <div className="calNavBtns">
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    setViewMonth(
                      (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                    )
                  }
                >
                  ← Previous
                </button>
                <button
                  type="button"
                  className="btn"
                  onClick={() =>
                    setViewMonth(
                      (d) => new Date(d.getFullYear(), d.getMonth() + 1, 1)
                    )
                  }
                >
                  Next →
                </button>
              </div>
            </div>
            <div className="calGrid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="calHead">
                  {d}
                </div>
              ))}
              {cal.cells.map((c, i) => {
                if (c.day == null || c.key == null) {
                  return <div key={`e-${i}`} className="calCell muted" />;
                }
                const dayKey = c.key;
                const list = byDayMap[dayKey] || [];
                const isToday = dayKey === todayKey;
                const cls =
                  "calCell" +
                  (isToday ? " today" : "") +
                  (list.length > 0 ? " hasAppts" : "") +
                  (selectedCalKey === dayKey ? " calSelected" : "");
                return (
                  <div key={dayKey} className={cls}>
                    <button
                      type="button"
                      className="calCellBtn"
                      onClick={() => setSelectedCalKey(dayKey)}
                      aria-pressed={selectedCalKey === dayKey}
                      aria-label={`Select ${dayKey}, ${list.length} appointment${
                        list.length === 1 ? "" : "s"
                      }`}
                    >
                      <div className="calDayNum">
                        <span className="calDay">{c.day}</span>
                        {list.length > 0 ? (
                          <span className="calBadge">{list.length}</span>
                        ) : null}
                      </div>
                      {list.slice(0, 4).map((a) => (
                        <div
                          key={a.id}
                          className="calItem"
                          title={`${a.name} · ${a.time} · ${a.service}`}
                        >
                          {a.time} · {a.name}
                        </div>
                      ))}
                      {list.length > 4 ? (
                        <div className="calItem">+{list.length - 4} more</div>
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="calDayDetail">
              <h3>
                Appointments on{" "}
                {new Date(selectedCalKey + "T12:00:00").toLocaleDateString(
                  undefined,
                  {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }
                )}
              </h3>
              {selectedDayAppointments.length === 0 ? (
                <p className="meta" style={{ margin: 0 }}>
                  No appointments on this date.
                </p>
              ) : (
                <div className="tableWrap">
                  <table className="table">
                    <thead>
                      <tr>
                        {["Time", "Name", "Phone", "Service", "City", "Status"].map(
                          (h) => (
                            <th key={h} className="th">
                              {h}
                            </th>
                          )
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedDayAppointments.map((r) => (
                        <tr key={r.id} className="tr">
                          <td className="td">{r.time}</td>
                          <td className="td">{r.name}</td>
                          <td className="td">{r.phone}</td>
                          <td className="td">{r.service}</td>
                          <td className="td">{r.city}</td>
                          <td className="tdMuted">{labelStatus(r.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {tab === "analytics" && insightsAccess ? (
          <div className="panel">
            <h2 className="panelHead">Analytics overview</h2>
            <p className="panelLead">
              Summary metrics reflect your current dataset. Use the trend chart to
              compare appointment volume by week, month, or year within any date
              range you choose.
            </p>
            <div className="statGrid">
              <div className="statCard">
                <strong>{analytics.total}</strong>
                <span>Total appointments in view</span>
              </div>
              <div className="statCard">
                <strong>{Object.keys(analytics.byStatus).length}</strong>
                <span>Distinct status labels</span>
              </div>
              <div className="statCard">
                <strong>{Object.keys(analytics.byCity).length}</strong>
                <span>Cities represented</span>
              </div>
            </div>

            <div className="trendPanel">
              <div className="trendHead">
                <h3 className="trendTitle">Appointment trend</h3>
                <div className="trendControls">
                  <div
                    className="granTabs"
                    role="group"
                    aria-label="Chart granularity"
                  >
                    {(
                      [
                        ["week", "Weekly"],
                        ["month", "Monthly"],
                        ["year", "Yearly"],
                      ] as const
                    ).map(([g, lab]) => (
                      <button
                        key={g}
                        type="button"
                        className={`granTab ${
                          chartGranularity === g ? "on" : ""
                        }`}
                        onClick={() => setChartGranularity(g)}
                      >
                        {lab}
                      </button>
                    ))}
                  </div>
                  <div className="datePair">
                    <div className="miniField">
                      <label htmlFor={`cf-${chartUid}`}>From</label>
                      <input
                        id={`cf-${chartUid}`}
                        type="date"
                        value={chartFrom}
                        onChange={(e) => setChartFrom(e.target.value)}
                      />
                    </div>
                    <div className="miniField">
                      <label htmlFor={`ct-${chartUid}`}>To</label>
                      <input
                        id={`ct-${chartUid}`}
                        type="date"
                        value={chartTo}
                        onChange={(e) => setChartTo(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <TrendChart
                uid={chartUid}
                series={appointmentTrend}
              />
              <div className="trendFoot">
                <span>
                  {appointmentTrend.reduce((s, p) => s + p.count, 0)} appointments
                  in range · Granularity: {chartGranularity}
                </span>
                <span>
                  Tip: widen the date range for yearly view across multiple years.
                </span>
              </div>
            </div>

            <div className="barBlock">
              <h4>By status</h4>
              {Object.entries(analytics.byStatus).length === 0 ? (
                <p className="meta" style={{ margin: 0 }}>
                  No status data yet.
                </p>
              ) : (
                Object.entries(analytics.byStatus).map(([k, v]) => (
                  <div key={k} className="barRow">
                    <span title={k}>{k}</span>
                    <div className="barBg">
                      <div
                        className="barFi"
                        style={{
                          width: `${Math.min(100, (v / maxBarStatus) * 100)}%`,
                        }}
                      />
                    </div>
                    <span className="barCt">{v}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : null}

        {tab === "team" && manageTeam ? (
          <div className="panel">
            <h2 className="panelHead">Team & access</h2>
            <p className="panelLead">
              Create staff logins and assign roles. Your own role is shown as
              read-only — only another super admin can change it from their account.
            </p>
            <form className="teamRow" onSubmit={addTeamUser}>
              <div className="teamField">
                <label htmlFor="nu-user">Username</label>
                <input
                  id="nu-user"
                  autoComplete="off"
                  placeholder="e.g. reception1"
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, username: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="teamField">
                <label htmlFor="nu-pass">Temporary password</label>
                <input
                  id="nu-pass"
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, password: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="teamField roleField">
                <label htmlFor="nu-role">Role</label>
                <select
                  id="nu-role"
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((u) => ({
                      ...u,
                      role: e.target.value as Role,
                    }))
                  }
                >
                  {ALL_ROLES.map((r) => (
                    <option key={r} value={r}>
                      {roleLabel(r)}
                    </option>
                  ))}
                </select>
              </div>
              <button type="submit" className="teamSubmit">
                Add user
              </button>
            </form>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">User</th>
                    <th className="th">Role</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamUsers.map((u) => {
                    const isSelf = me.id === u.id;
                    return (
                      <tr key={u.id} className="tr">
                        <td className="td">
                          <div className="userCell">
                            <span>{u.username}</span>
                            {isSelf ? (
                              <span className="rolePill you">You</span>
                            ) : null}
                          </div>
                        </td>
                        <td className="td">
                          {isSelf ? (
                            <span
                              className="meta"
                              title="Only another super admin can change your role"
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.5rem",
                                flexWrap: "wrap",
                              }}
                            >
                              <strong style={{ color: "#e2e8f0" }}>
                                {roleLabel(u.role)}
                              </strong>
                              <span
                                className="rolePill"
                                style={{
                                  background: "rgba(100,116,139,0.2)",
                                  color: "#94a3b8",
                                  border: "1px solid rgba(148,163,184,0.35)",
                                }}
                              >
                                Locked
                              </span>
                            </span>
                          ) : (
                            <select
                              className="statusSelect"
                              value={u.role}
                              onChange={(e) =>
                                changeTeamRole(u.id, e.target.value as Role)
                              }
                            >
                              {ALL_ROLES.map((r) => (
                                <option key={r} value={r}>
                                  {roleLabel(r)}
                                </option>
                              ))}
                            </select>
                          )}
                        </td>
                        <td className="td">
                          <div className="rowActions">
                            <button
                              type="button"
                              className="iconBtn"
                              onClick={() =>
                                resetTeamPassword(u.id, u.username)
                              }
                            >
                              Reset password
                            </button>
                            <button
                              type="button"
                              className="iconBtn"
                              disabled={isSelf}
                              style={
                                isSelf
                                  ? undefined
                                  : {
                                      borderColor: "rgba(248,113,113,0.35)",
                                      color: "#fca5a5",
                                    }
                              }
                              onClick={() =>
                                deleteTeamUser(u.id, u.username)
                              }
                            >
                              Remove
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : null}

        {editRow ? (
          <div
            className="overlay"
            role="dialog"
            aria-modal="true"
            aria-labelledby="edit-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) closeEdit();
            }}
          >
            <form
              className="modal"
              onSubmit={saveEdit}
              onClick={(e) => e.stopPropagation()}
            >
              <h2 id="edit-title">Edit appointment</h2>
              {(
                [
                  ["name", "Name"],
                  ["phone", "Phone"],
                  ["service", "Service"],
                  ["date", "Date"],
                  ["time", "Time"],
                  ["city", "City"],
                ] as const
              ).map(([key, label]) => (
                <div key={key} className="field">
                  <label htmlFor={key}>{label}</label>
                  <input
                    id={key}
                    required
                    value={form[key]}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, [key]: e.target.value }))
                    }
                  />
                </div>
              ))}
              <div className="field">
                <label htmlFor="status">Status</label>
                <select
                  id="status"
                  value={form.status}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      status: e.target.value as Status,
                    }))
                  }
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {labelStatus(s)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="modalActions">
                <button type="button" className="btn" onClick={closeEdit}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btnPrimary"
                  disabled={busyId === editRow.id}
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        ) : null}
      </div>
    </div>
  );
}
