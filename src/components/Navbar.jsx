import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { Bell } from "lucide-react";

export default function Navbar() {
  const { user, profile, notifications } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user || !profile) return null;

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <nav className="bg-white shadow sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/dashboard" className="text-2xl font-bold text-yellow-500">
          FixBee 🐝
        </Link>

        {/* Customer Links */}
        {profile.role === "customer" && (
          <div className="hidden md:flex gap-6 text-sm font-medium">
            <Link to="/dashboard" className="hover:text-yellow-500">
              Home
            </Link>
            <Link to="/book" className="hover:text-yellow-500">
              Book Service
            </Link>
            <Link to="/bookings" className="hover:text-yellow-500">
              My Bookings
            </Link>
            <Link to="/profile" className="hover:text-yellow-500">
              Profile
            </Link>
          </div>
        )}

        {/* Right */}
        <div className="flex items-center gap-4">
          {/* Notifications */}
          <button
            onClick={() => navigate("/notifications")}
            className="relative"
          >
            <Bell className="w-6 h-6 text-gray-600" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs px-2 rounded-full">
                {unreadCount}
              </span>
            )}
          </button>

          <span className="hidden sm:block text-sm text-gray-500">
            {user.email}
          </span>

          <button
            onClick={logout}
            className="bg-yellow-400 text-black px-4 py-1 rounded hover:bg-yellow-300 text-sm"
          >
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}
