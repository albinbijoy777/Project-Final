import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { normalizeRole } from "../utils/roles.js";
import { getDashboardPath } from "../utils/routes.js";

export default function RoleRoute({ allowedRoles }) {
  const { profile, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="flex items-center gap-3 rounded-full border border-white/10 bg-slate-950/70 px-5 py-3 text-sm text-slate-300">
          <div className="size-4 animate-spin rounded-full border-2 border-white/15 border-t-amber-200" />
          Preparing your dashboard...
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const currentRole = normalizeRole(profile?.role || user?.user_metadata?.role || "user");
  const allowed = allowedRoles.map((role) => normalizeRole(role));

  if (!allowed.includes(currentRole)) {
    return <Navigate to={getDashboardPath(currentRole)} replace />;
  }

  return <Outlet />;
}
