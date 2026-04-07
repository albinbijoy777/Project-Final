import { normalizeRole } from "./roles.js";

export function getDashboardPath(role) {
  const nextRole = normalizeRole(role);

  if (nextRole === "worker") return "/worker";
  if (nextRole === "admin") return "/admin";
  return "/user";
}
