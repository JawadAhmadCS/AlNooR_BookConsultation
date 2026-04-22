export type Role = "superadmin" | "admin" | "viewer";

export function canEditAppointments(role: Role): boolean {
  return role === "admin" || role === "superadmin";
}

export function canManageUsers(role: Role): boolean {
  return role === "superadmin";
}

/** Calendar + analytics (same gate as editing appointments: admin & super admin). */
export function canViewCalendarAndAnalytics(role: Role): boolean {
  return canEditAppointments(role);
}

export function canUseSuperFeatures(role: Role): boolean {
  return role === "superadmin";
}
