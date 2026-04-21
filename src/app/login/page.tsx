"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const css = `
.loginPage{min-height:100vh;display:grid;place-items:center;padding:1.5rem;background:linear-gradient(165deg,#0c1117 0%,#111a28 50%,#0d1520 100%);font-family:system-ui,sans-serif}
.loginCard{width:100%;max-width:400px;padding:2rem;border-radius:16px;border:1px solid rgba(255,255,255,0.1);background:rgba(20,27,36,0.95);box-shadow:0 24px 80px rgba(0,0,0,0.45)}
.loginCard h1{margin:0 0 0.35rem;font-size:1.35rem;color:#f1f5f9;font-weight:700}
.loginCard p{margin:0 0 1.5rem;color:#94a3b8;font-size:0.9rem}
.loginCard label{display:block;font-size:0.72rem;font-weight:600;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:0.35rem}
.loginCard input{width:100%;padding:0.65rem 0.75rem;border-radius:10px;border:1px solid rgba(255,255,255,0.12);background:#0c1117;color:#e8edf4;font-size:1rem;margin-bottom:1rem}
.loginCard button{width:100%;padding:0.75rem;border-radius:10px;border:none;background:linear-gradient(135deg,#5eead4,#2dd4bf);color:#042f2e;font-weight:700;cursor:pointer;font-size:0.95rem}
.loginCard button:disabled{opacity:0.6;cursor:not-allowed}
.loginErr{margin:0 0 1rem;padding:0.65rem;border-radius:10px;background:rgba(220,38,38,0.12);border:1px solid rgba(248,113,113,0.25);color:#fca5a5;font-size:0.88rem}
.loginFoot{margin-top:1.25rem;text-align:center}
.loginFoot a{color:#5eead4;text-decoration:none;font-size:0.9rem}
`;

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error || "Login failed");
      }
      router.replace("/dashboard");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="loginPage">
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div className="loginCard">
        <h1>Al Noor Care Hospital</h1>
        <p>Staff sign-in for appointments dashboard</p>
        <form onSubmit={onSubmit}>
          {error ? (
            <p className="loginErr" role="alert">
              {error}
            </p>
          ) : null}
          <label htmlFor="user">Username</label>
          <input
            id="user"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <label htmlFor="pass">Password</label>
          <input
            id="pass"
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={busy}>
            {busy ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="loginFoot">
          <a href="/">← Back to hospital website</a>
        </p>
      </div>
    </div>
  );
}
