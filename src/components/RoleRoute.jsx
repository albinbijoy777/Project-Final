import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function RoleRoute({ children, allowed }) {
  const { user, profile, loading } = useAuth();

  if (loading) return null;
  if (!user || !profile) return <Navigate to="/" />;

  if (!allowed.includes(profile.role)) {
    return <Navigate to="/dashboard" />;
  }

  return children;
}
