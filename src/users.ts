import bcrypt from "bcryptjs";
import postgres from "postgres";
import type { Role } from "@/roles";

export type DashboardUser = {
  id: string;
  username: string;
  role: Role;
  createdAt: string;
};

const g = globalThis as unknown as {
  __usersMem?: {
    id: string;
    username: string;
    password_hash: string;
    role: Role;
    created_at: string;
  }[];
  __usersSql?: ReturnType<typeof postgres>;
};

function memoryUsers() {
  if (!g.__usersMem) g.__usersMem = [];
  return g.__usersMem;
}

function getSql() {
  const url = process.env.DATABASE_URL;
  if (!url) return null;
  if (!g.__usersSql) {
    g.__usersSql = postgres(url, { prepare: false });
  }
  return g.__usersSql;
}

let usersSchemaDone = false;

async function ensureUsersTable(sql: ReturnType<typeof postgres>) {
  if (usersSchemaDone) return;
  await sql`
    create table if not exists dashboard_users (
      id uuid primary key default gen_random_uuid(),
      username text not null unique,
      password_hash text not null,
      role text not null,
      created_at timestamptz not null default now()
    )
  `;
  usersSchemaDone = true;
}

const DEFAULT_SUPER = { username: "superadmin", password: "1234" } as const;

async function seedSuperAdminIfEmpty(
  sql: ReturnType<typeof postgres> | null
) {
  if (!sql) {
    const mem = memoryUsers();
    if (mem.length > 0) return;
    const hash = bcrypt.hashSync(DEFAULT_SUPER.password, 10);
    mem.push({
      id: crypto.randomUUID(),
      username: DEFAULT_SUPER.username,
      password_hash: hash,
      role: "superadmin",
      created_at: new Date().toISOString(),
    });
    return;
  }
  await ensureUsersTable(sql);
  const c = await sql`select count(*)::int as n from dashboard_users`;
  const n = (c[0] as { n: number }).n;
  if (n > 0) return;
  const hash = bcrypt.hashSync(DEFAULT_SUPER.password, 10);
  await sql`
    insert into dashboard_users (username, password_hash, role)
    values (${DEFAULT_SUPER.username}, ${hash}, 'superadmin')
  `;
}

function rowPublic(r: {
  id: string;
  username: string;
  role: string;
  created_at: Date | string;
}): DashboardUser {
  return {
    id: r.id,
    username: r.username,
    role: r.role as Role,
    createdAt:
      r.created_at instanceof Date
        ? r.created_at.toISOString()
        : String(r.created_at),
  };
}

function normalizeRole(r: string): Role | null {
  const x = r.toLowerCase().trim();
  if (x === "superadmin" || x === "admin" || x === "viewer") return x;
  return null;
}

export async function verifyUserPassword(
  username: string,
  password: string
): Promise<DashboardUser | null> {
  const sql = getSql();
  await seedSuperAdminIfEmpty(sql);
  const u = username.trim().toLowerCase();
  if (!sql) {
    const row = memoryUsers().find(
      (x) => x.username.toLowerCase() === u
    );
    if (!row) return null;
    if (!bcrypt.compareSync(password, row.password_hash)) return null;
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      createdAt: row.created_at,
    };
  }
  await ensureUsersTable(sql);
  const rows = (await sql`
    select id, username, password_hash, role, created_at
    from dashboard_users
    where lower(username) = ${u}
  `) as {
    id: string;
    username: string;
    password_hash: string;
    role: string;
    created_at: Date;
  }[];
  const row = rows[0];
  if (!row) return null;
  const ok = await bcrypt.compare(password, row.password_hash);
  if (!ok) return null;
  return rowPublic(row);
}

export async function listDashboardUsers(): Promise<DashboardUser[]> {
  const sql = getSql();
  await seedSuperAdminIfEmpty(sql);
  if (!sql) {
    return memoryUsers().map((r) => ({
      id: r.id,
      username: r.username,
      role: r.role,
      createdAt: r.created_at,
    }));
  }
  await ensureUsersTable(sql);
  const rows = (await sql`
    select id, username, role, created_at
    from dashboard_users
    order by created_at asc
  `) as {
    id: string;
    username: string;
    role: string;
    created_at: Date;
  }[];
  return rows.map(rowPublic);
}

export async function createDashboardUser(input: {
  username: string;
  password: string;
  role: Role;
}): Promise<DashboardUser | "duplicate" | "bad_role"> {
  const sql = getSql();
  await seedSuperAdminIfEmpty(sql);
  const role = normalizeRole(input.role);
  if (!role) return "bad_role";
  const uname = input.username.trim();
  if (uname.length < 2) throw new Error("Username too short");
  const hash = bcrypt.hashSync(input.password, 10);
  if (!sql) {
    const mem = memoryUsers();
    if (mem.some((x) => x.username.toLowerCase() === uname.toLowerCase()))
      return "duplicate";
    const row = {
      id: crypto.randomUUID(),
      username: uname,
      password_hash: hash,
      role,
      created_at: new Date().toISOString(),
    };
    mem.push(row);
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      createdAt: row.created_at,
    };
  }
  await ensureUsersTable(sql);
  try {
    const rows = (await sql`
      insert into dashboard_users (username, password_hash, role)
      values (${uname}, ${hash}, ${role})
      returning id, username, role, created_at
    `) as {
      id: string;
      username: string;
      role: string;
      created_at: Date;
    }[];
    return rowPublic(rows[0]!);
  } catch {
    return "duplicate";
  }
}

export async function deleteDashboardUser(
  id: string,
  actorUserId: string
): Promise<"ok" | "not_found" | "forbidden" | "last_superadmin"> {
  const sql = getSql();
  await seedSuperAdminIfEmpty(sql);
  if (id === actorUserId) return "forbidden";
  if (!sql) {
    const mem = memoryUsers();
    const idx = mem.findIndex((x) => x.id === id);
    if (idx === -1) return "not_found";
    const target = mem[idx]!;
    if (target.role === "superadmin") {
      const supers = mem.filter((x) => x.role === "superadmin");
      if (supers.length <= 1) return "last_superadmin";
    }
    mem.splice(idx, 1);
    return "ok";
  }
  await ensureUsersTable(sql);
  const existing = (await sql`
    select id, role from dashboard_users where id = ${id}
  `) as { id: string; role: string }[];
  if (!existing[0]) return "not_found";
  if (existing[0].role === "superadmin") {
    const c = await sql`
      select count(*)::int as n from dashboard_users where role = 'superadmin'
    `;
    if ((c[0] as { n: number }).n <= 1) return "last_superadmin";
  }
  const del = await sql`
    delete from dashboard_users where id = ${id} returning id
  `;
  return del.length ? "ok" : "not_found";
}

export async function updateDashboardUser(
  id: string,
  updates: { password?: string; role?: Role }
): Promise<DashboardUser | "not_found" | "last_superadmin"> {
  const sql = getSql();
  await seedSuperAdminIfEmpty(sql);
  const roleIn = updates.role;
  if (!sql) {
    const mem = memoryUsers();
    const row = mem.find((x) => x.id === id);
    if (!row) return "not_found";
    if (roleIn === "superadmin" || row.role === "superadmin") {
      const supers = mem.filter((x) => x.role === "superadmin");
      if (
        row.role === "superadmin" &&
        roleIn &&
        roleIn !== "superadmin" &&
        supers.length <= 1
      ) {
        return "last_superadmin";
      }
    }
    if (updates.password) {
      row.password_hash = bcrypt.hashSync(updates.password, 10);
    }
    if (roleIn) row.role = roleIn;
    return {
      id: row.id,
      username: row.username,
      role: row.role,
      createdAt: row.created_at,
    };
  }
  await ensureUsersTable(sql);
  const rows = (await sql`
    select id, username, role, password_hash, created_at
    from dashboard_users where id = ${id}
  `) as {
    id: string;
    username: string;
    role: string;
    password_hash: string;
    created_at: Date;
  }[];
  const row = rows[0];
  if (!row) return "not_found";
  if (
    row.role === "superadmin" &&
    roleIn &&
    roleIn !== "superadmin"
  ) {
    const c = await sql`
      select count(*)::int as n from dashboard_users where role = 'superadmin'
    `;
    if ((c[0] as { n: number }).n <= 1) return "last_superadmin";
  }
  let newHash = row.password_hash;
  if (updates.password) {
    newHash = bcrypt.hashSync(updates.password, 10);
  }
  let newRole = row.role as Role;
  if (roleIn) newRole = roleIn;
  const out = (await sql`
    update dashboard_users
    set
      password_hash = ${newHash},
      role = ${newRole}
    where id = ${id}
    returning id, username, role, created_at
  `) as {
    id: string;
    username: string;
    role: string;
    created_at: Date;
  }[];
  return rowPublic(out[0]!);
}
