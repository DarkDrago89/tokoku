export type Role = "owner" | "admin" | "staff";
export type Action = "customer.delete" | "report.view" | "data.export" | "settings.manage";

/** Matriks hak akses dari dokumen kebutuhan bagian 3.1. */
const MATRIX: Record<Action, Role[]> = {
  "customer.delete": ["owner", "admin"],
  "report.view": ["owner", "admin"],
  "data.export": ["owner", "admin"],
  "settings.manage": ["owner"],
};

export const ROLE_LABEL: Record<Role, string> = { owner: "Pemilik", admin: "Admin", staff: "Staf" };

export function can(role: Role, action: Action): boolean {
  return MATRIX[action].includes(role);
}

export class ForbiddenError extends Error {
  constructor() {
    super("Anda tidak punya akses untuk tindakan ini.");
  }
}

export function assertCan(role: Role, action: Action): void {
  if (!can(role, action)) throw new ForbiddenError();
}
