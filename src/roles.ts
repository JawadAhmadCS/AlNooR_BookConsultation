export type Role = "superadmin" | "admin" | "viewer";

export function canEditAppointments(role: Role): boolean {
  return role === "admin" || role === "superadmin";
}

export function canManageUsers(role: Role): boolean {
  return role === "superadmin";
}

export function canUseSuperFeatures(role: Role): boolean {
  return role === "superadmin";
}
