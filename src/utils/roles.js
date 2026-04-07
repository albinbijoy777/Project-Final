const ROLE_ALIASES = {
  user: new Set(["user", "customer", "client", "member", "homeowner"]),
  worker: new Set(["worker", "technician", "tech", "provider", "professional"]),
  admin: new Set(["admin", "superadmin", "super_admin", "operator", "manager"]),
};

export function normalizeRole(role) {
  const value = String(role || "").trim().toLowerCase();

  if (!value) return "user";

  for (const [canonicalRole, aliases] of Object.entries(ROLE_ALIASES)) {
    if (aliases.has(value)) {
      return canonicalRole;
    }
  }

  return value;
}

export function matchesRole(role, expectedRole) {
  return normalizeRole(role) === normalizeRole(expectedRole);
}
