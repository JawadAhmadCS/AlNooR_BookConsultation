"use client";

import { BOOKING_ROUTES } from "@/config";
import {
  computeAppointmentAnalytics,
  normalizeDayKey,
} from "@/appointment-analytics";
import { canEditAppointments, canManageUsers, canUseSuperFeatures } from "@/roles";
import type { Role } from "@/roles";
import type { Appointment } from "@/bookings";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

const dashCss = `
.dash{min-height:100vh;background:linear-gradient(165deg,#0c1117 0%,#111a28 45%,#0d1520 100%);color:#e8edf4;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
.dash .inner{max-width:1320px;margin:0 auto;padding:1.5rem 1.25rem 3rem}
.dash .top{display:flex;flex-wrap:wrap;align-items:flex-start;justify-content:space-between;gap:1rem;margin-bottom:1rem}
.dash .title{margin:0;font-size:1.65rem;font-weight:700;letter-spacing:-0.03em;background:linear-gradient(120deg,#5eead4,#38bdf8,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent}
.dash .sub{margin:0.35rem 0 0;color:#8b9aaf;font-size:0.92rem;max-width:42rem}
.dash .meta{color:#94a3b8;font-size:0.85rem}
.dash .actions{display:flex;flex-wrap:wrap;gap:0.5rem;align-items:center}
.dash .btn{padding:0.5rem 0.95rem;border-radius:10px;font-size:0.88rem;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.12);background:rgba(26,35,50,0.9);color:#e8edf4}
.dash .btnPrimary{border:none;background:linear-gradient(135deg,#5eead4,#2dd4bf);color:#042f2e}
.dash .btnDanger{border-color:rgba(248,113,113,0.4);color:#fca5a5}
.dash .link{color:#5eead4;text-decoration:none;font-size:0.9rem}
.dash .tabs{display:flex;flex-wrap:wrap;gap:0.35rem;margin-bottom:1.25rem}
.dash .tab{padding:0.45rem 0.95rem;border-radius:999px;font-size:0.85rem;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.12);background:transparent;color:#94a3b8}
.dash .tab.on{background:rgba(94,234,212,0.12);border-color:rgba(94,234,212,0.35);color:#5eead4}
.dash .error{color:#fca5a5;margin:0 0 1rem;padding:0.75rem 1rem;border-radius:10px;background:rgba(220,38,38,0.12);border:1px solid rgba(248,113,113,0.25)}
.dash .tableWrap{border-radius:16px;overflow:auto;border:1px solid rgba(255,255,255,0.08);background:rgba(20,27,36,0.85)}
.dash .table{width:100%;border-collapse:collapse;font-size:0.875rem}
.dash .th{text-align:left;padding:0.85rem 1rem;font-weight:600;color:#94a3b8;text-transform:uppercase;font-size:0.72rem;letter-spacing:0.06em;border-bottom:1px solid rgba(255,255,255,0.08);background:rgba(12,17,23,0.95)}
.dash .tr{border-bottom:1px solid rgba(255,255,255,0.05)}
.dash .td{padding:0.75rem 1rem;color:#e2e8f0}
.dash .tdMuted{padding:0.75rem 1rem;color:#94a3b8;font-size:0.82rem}
.dash .empty{padding:2.5rem 1.5rem;text-align:center;color:#8b9aaf}
.dash .statusSelect{padding:0.4rem 0.55rem;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:#141b24;color:#e8edf4;font-size:0.82rem;min-width:118px}
.dash .rowActions{display:flex;flex-wrap:wrap;gap:0.35rem}
.dash .iconBtn{padding:0.35rem 0.65rem;border-radius:8px;font-size:0.78rem;font-weight:600;cursor:pointer;border:1px solid rgba(255,255,255,0.12);background:rgba(26,35,50,0.8);color:#cbd5e1}
.dash .iconBtn:disabled{opacity:0.45;cursor:not-allowed}
.dash .overlay{position:fixed;inset:0;background:rgba(0,0,0,0.65);display:grid;place-items:center;z-index:50;padding:1rem}
.dash .modal{width:100%;max-width:440px;border-radius:16px;border:1px solid rgba(255,255,255,0.1);background:#141b24;padding:1.35rem 1.5rem}
.dash .modal h2{margin:0 0 1rem;font-size:1.1rem;color:#f1f5f9}
.dash .field{margin-bottom:0.85rem}
.dash .field label{display:block;font-size:0.72rem;font-weight:600;text-transform:uppercase;color:#94a3b8;margin-bottom:0.35rem}
.dash .field input,.dash .field select{width:100%;padding:0.55rem 0.65rem;border-radius:8px;border:1px solid rgba(255,255,255,0.12);background:#0c1117;color:#e8edf4;font-size:0.9rem}
.dash .modalActions{display:flex;gap:0.5rem;justify-content:flex-end;margin-top:1.25rem}
.dash .calNav{display:flex;align-items:center;justify-content:space-between;margin-bottom:1rem;gap:0.75rem}
.dash .calGrid{display:grid;grid-template-columns:repeat(7,1fr);gap:0.35rem;font-size:0.78rem}
.dash .calHead{color:#64748b;font-weight:600;text-align:center;padding:0.25rem}
.dash .calCell{min-height:88px;border-radius:10px;border:1px solid rgba(255,255,255,0.08);background:rgba(12,17,23,0.5);padding:0.35rem;vertical-align:top}
.dash .calCell.muted{opacity:0.35}
.dash .calDay{font-weight:700;color:#cbd5e1;font-size:0.75rem}
.dash .calItem{font-size:0.7rem;color:#94a3b8;margin-top:0.2rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.dash .statGrid{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.75rem;margin-bottom:1.25rem}
.dash .statCard{border:1px solid rgba(255,255,255,0.1);border-radius:12px;padding:1rem;background:rgba(12,17,23,0.6)}
.dash .statCard strong{display:block;font-size:1.5rem;color:#5eead4;font-family:Georgia,serif}
.dash .statCard span{font-size:0.8rem;color:#94a3b8}
.dash .barRow{display:flex;align-items:center;gap:0.5rem;margin-bottom:0.45rem;font-size:0.82rem}
.dash .barRow span:first-child{flex:0 0 38%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#cbd5e1}
.dash .barBg{flex:1;height:8px;border-radius:4px;background:rgba(255,255,255,0.06);overflow:hidden}
.dash .barFi{height:100%;background:linear-gradient(90deg,#5eead4,#38bdf8);border-radius:4px}
.dash .teamForm{display:grid;grid-template-columns:1fr 1fr auto;gap:0.5rem;align-items:end;margin-bottom:1.25rem}
@media(max-width:720px){.dash .teamForm{grid-template-columns:1fr}}
`;

type Status = "pending" | "confirmed" | "cancelled";
type Tab = "list" | "calendar" | "analytics" | "team";

const STATUSES: Status[] = ["pending", "confirmed", "cancelled"];

type Me = { username: string; role: Role };

type TeamUser = { id: string; username: string; role: Role; createdAt: string };

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
  const [teamUsers, setTeamUsers] = useState<TeamUser[]>([]);
  const [newUser, setNewUser] = useState({
    username: "",
    password: "",
    role: "viewer" as "admin" | "viewer",
  });

  const canEdit = me ? canEditAppointments(me.role) : false;
  const superUser = me ? canUseSuperFeatures(me.role) : false;
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

  const maxBar = useMemo(() => {
    const vals = [
      ...Object.values(analytics.byStatus),
      ...analytics.topServices.map((t) => t.count),
    ];
    return Math.max(1, ...vals);
  }, [analytics]);

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
    setNewUser({ username: "", password: "", role: "viewer" });
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
    return { cells, label: viewMonth.toLocaleString(undefined, { month: "long", year: "numeric" }) };
  }, [viewMonth]);

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
        <header className="top">
          <div>
            <h1 className="title">Appointments</h1>
            <p className="sub">
              Signed in as <strong>{me.username}</strong> ({me.role}). Online
              bookings post to{" "}
              <code style={{ color: "#5eead4", fontSize: "0.88em" }}>
                {BOOKING_ROUTES.create}
              </code>
            </p>
            <p className="meta">
              List auto-refreshes every {BOOKING_ROUTES.pollMs / 1000}s.
            </p>
          </div>
          <div className="actions">
            <button type="button" className="btnPrimary" onClick={() => loadRows()}>
              Refresh
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
            List
          </button>
          {superUser ? (
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
              <button
                type="button"
                className={`tab ${tab === "team" ? "on" : ""}`}
                onClick={() => setTab("team")}
              >
                Team
              </button>
            </>
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

        {tab === "calendar" && superUser ? (
          <div>
            <div className="calNav">
              <button
                type="button"
                className="btn"
                onClick={() =>
                  setViewMonth(
                    (d) => new Date(d.getFullYear(), d.getMonth() - 1, 1)
                  )
                }
              >
                ← Prev
              </button>
              <strong style={{ color: "#e2e8f0" }}>{cal.label}</strong>
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
            <div className="calGrid">
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
                <div key={d} className="calHead">
                  {d}
                </div>
              ))}
              {cal.cells.map((c, i) => {
                if (c.day == null || !c.key) {
                  return (
                    <div key={`e-${i}`} className="calCell muted" />
                  );
                }
                const list = byDayMap[c.key] || [];
                return (
                  <div key={c.key} className="calCell">
                    <div className="calDay">{c.day}</div>
                    {list.slice(0, 4).map((a) => (
                      <div key={a.id} className="calItem" title={`${a.name} · ${a.time}`}>
                        {a.time} {a.name}
                      </div>
                    ))}
                    {list.length > 4 ? (
                      <div className="calItem">+{list.length - 4} more</div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {tab === "analytics" && superUser ? (
          <div>
            <div className="statGrid">
              <div className="statCard">
                <strong>{analytics.total}</strong>
                <span>Total appointments (loaded)</span>
              </div>
              <div className="statCard">
                <strong>{Object.keys(analytics.byStatus).length}</strong>
                <span>Distinct status values in data</span>
              </div>
              <div className="statCard">
                <strong>{Object.keys(analytics.byCity).length}</strong>
                <span>Cities in sample</span>
              </div>
            </div>
            <h3 style={{ fontSize: "1rem", color: "#cbd5e1", margin: "0 0 0.75rem" }}>
              By status (dynamic keys)
            </h3>
            {Object.entries(analytics.byStatus).map(([k, v]) => (
              <div key={k} className="barRow">
                <span title={k}>{k}</span>
                <div className="barBg">
                  <div
                    className="barFi"
                    style={{
                      width: `${Math.min(100, (v / maxBar) * 100)}%`,
                    }}
                  />
                </div>
                <span style={{ flex: "0 0 2rem", textAlign: "right" }}>{v}</span>
              </div>
            ))}
            <h3 style={{ fontSize: "1rem", color: "#cbd5e1", margin: "1.25rem 0 0.75rem" }}>
              Top services
            </h3>
            {analytics.topServices.map(({ name, count }) => (
              <div key={name} className="barRow">
                <span title={name}>{name}</span>
                <div className="barBg">
                  <div
                    className="barFi"
                    style={{
                      width: `${Math.min(100, (count / maxBar) * 100)}%`,
                    }}
                  />
                </div>
                <span style={{ flex: "0 0 2rem", textAlign: "right" }}>{count}</span>
              </div>
            ))}
          </div>
        ) : null}

        {tab === "team" && manageTeam ? (
          <div>
            <form className="teamForm" onSubmit={addTeamUser}>
              <div className="field" style={{ margin: 0 }}>
                <label>New username</label>
                <input
                  value={newUser.username}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, username: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Temporary password</label>
                <input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((u) => ({ ...u, password: e.target.value }))
                  }
                  required
                />
              </div>
              <div className="field" style={{ margin: 0 }}>
                <label>Role</label>
                <select
                  value={newUser.role}
                  onChange={(e) =>
                    setNewUser((u) => ({
                      ...u,
                      role: e.target.value as "admin" | "viewer",
                    }))
                  }
                >
                  <option value="viewer">Viewer</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <button type="submit" className="btnPrimary">
                Add user
              </button>
            </form>
            <div className="tableWrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="th">Username</th>
                    <th className="th">Role</th>
                    <th className="th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teamUsers.map((u) => (
                    <tr key={u.id} className="tr">
                      <td className="td">{u.username}</td>
                      <td className="td">
                        <select
                          className="statusSelect"
                          value={u.role}
                          onChange={(e) =>
                            changeTeamRole(u.id, e.target.value as Role)
                          }
                        >
                          <option value="viewer">viewer</option>
                          <option value="admin">admin</option>
                          <option value="superadmin">superadmin</option>
                        </select>
                      </td>
                      <td className="td">
                        <button
                          type="button"
                          className="iconBtn"
                          onClick={() => resetTeamPassword(u.id, u.username)}
                        >
                          Reset password
                        </button>
                        <button
                          type="button"
                          className="iconBtn"
                          style={{
                            borderColor: "rgba(248,113,113,0.35)",
                            color: "#fca5a5",
                          }}
                          onClick={() => deleteTeamUser(u.id, u.username)}
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
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
