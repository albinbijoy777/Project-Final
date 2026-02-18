import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";

export default function TechnicianNavbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (!user || !profile) return null;

  return (
    <nav className="bg-gray-900 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/tasks" className="text-xl font-bold text-yellow-400">
          FixBee Technician 🛠️
        </Link>

        <div className="flex gap-6 text-sm">
          <Link to="/tasks" className="hover:text-yellow-400">
            My Tasks
          </Link>
          <Link to="/profile" className="hover:text-yellow-400">
            Profile
          </Link>
        </div>

        <button
          onClick={logout}
          className="bg-yellow-400 text-black px-4 py-1 rounded text-sm hover:bg-yellow-300"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
