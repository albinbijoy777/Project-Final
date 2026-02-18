import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export default function AdminNavbar() {
  const navigate = useNavigate();

  const logout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  return (
    <nav className="bg-black text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
        <Link to="/admin" className="text-xl font-bold text-yellow-400">
          FixBee Admin 🐝
        </Link>

        <div className="flex gap-6 text-sm">
          <Link to="/admin" className="hover:text-yellow-400">Dashboard</Link>
          <Link to="/admin/services" className="hover:text-yellow-400">Services</Link>
        </div>

        <button
          onClick={logout}
          className="bg-yellow-400 text-black px-4 py-1 rounded text-sm"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}
