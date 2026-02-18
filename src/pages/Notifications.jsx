import { useAuth } from "../context/AuthContext";
import { supabase } from "../services/supabase";

export default function Notifications() {
  const { notifications } = useAuth();

  const markAsRead = async (id) => {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", id);
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Notifications</h1>

      {notifications.map((n) => (
        <div
          key={n.id}
          className={`p-4 mb-3 rounded border ${
            n.is_read ? "bg-gray-100" : "bg-white"
          }`}
          onClick={() => markAsRead(n.id)}
        >
          <h3 className="font-semibold">{n.title}</h3>
          <p className="text-sm text-gray-600">{n.message}</p>
        </div>
      ))}
    </div>
  );
}
