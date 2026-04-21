import { NextResponse } from "next/server";
import {
  SESSION_COOKIE_NAME,
  sessionCookieOptions,
  signSession,
} from "@/auth-session";
import { verifyUserPassword } from "@/users";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    let body: { username?: string; password?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password required" },
        { status: 400 }
      );
    }

    const user = await verifyUserPassword(username, password);
    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const token = await signSession({
      sub: user.id,
      username: user.username,
      role: user.role,
    });

    const res = NextResponse.json({
      ok: true,
      user: { username: user.username, role: user.role },
    });
    res.cookies.set(
      SESSION_COOKIE_NAME,
      token,
      sessionCookieOptions(60 * 60 * 24 * 7)
    );
    return res;
  } catch (e) {
    console.error("[auth/login]", e);
    const msg = e instanceof Error ? e.message : String(e);

    if (msg.includes("AUTH_SECRET")) {
      return NextResponse.json(
        {
          error:
            "Server misconfigured: set AUTH_SECRET (at least 16 characters) in Vercel → Project → Settings → Environment Variables for Production, then redeploy.",
          code: "AUTH_SECRET_MISSING",
        },
        { status: 500 }
      );
    }

    if (
      /connect|ECONNREFUSED|timeout|postgres|database|SSL|certificate/i.test(
        msg
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot reach the database. Check DATABASE_URL on Vercel and that the database allows connections from Vercel (SSL, IP allowlist).",
          code: "DATABASE_ERROR",
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          "Login failed (server error). Open Vercel → Deployment → Functions → /api/auth/login logs for details.",
        code: "SERVER_ERROR",
      },
      { status: 500 }
    );
  }
}
