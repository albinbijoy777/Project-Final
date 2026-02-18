import { useEffect, useState } from "react";
import TechnicianNavbar from "../components/TechnicianNavbar";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";

export default function TechnicianTasks() {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchTasks();
  }, [user]);

  const fetchTasks = async () => {
    setLoading(true);

    const { data } = await supabase
      .from("bookings")
      .select("*")
      .eq("technician_id", user.id)
      .order("service_date", { ascending: true });

    setTasks(data || []);
    setLoading(false);
  };

  const updateStatus = async (id, status) => {
    await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    fetchTasks();
  };

  return (
    <>
      <TechnicianNavbar />

      <div className="max-w-6xl mx-auto px-6 py-10 min-h-screen">
        <h1 className="text-3xl font-bold mb-6">My Assigned Jobs</h1>

        {loading && <p className="text-gray-500">Loading tasks...</p>}

        {!loading && tasks.length === 0 && (
          <p className="text-gray-500">No tasks assigned yet.</p>
        )}

        <div className="space-y-6">
          {tasks.map((t) => (
            <div key={t.id} className="bg-white shadow rounded p-6">
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{t.service}</h2>
                  <p className="text-sm text-gray-500">
                    {t.service_date} • {t.service_time}
                  </p>
                  <p className="text-sm mt-1">
                    Address: <b>{t.address}</b>
                  </p>
                  <p className="text-sm mt-1">Price: ₹{t.price}</p>
                  <p className="mt-1">
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {t.status.replace("_", " ")}
                    </span>
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Assigned based on your skills
                  </p>
                </div>

                <div className="flex flex-col gap-2 w-48">
                  {t.status === "assigned" && (
                    <>
                      <button
                        onClick={() => updateStatus(t.id, "confirmed")}
                        className="bg-green-600 text-white px-3 py-1 rounded"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => updateStatus(t.id, "cancelled")}
                        className="bg-red-600 text-white px-3 py-1 rounded"
                      >
                        Reject
                      </button>
                    </>
                  )}

                  {t.status === "confirmed" && (
                    <>
                      <button
                        onClick={() => updateStatus(t.id, "on_the_way")}
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                      >
                        On the way
                      </button>
                      <Link
                        to={`/chat/${t.id}`}
                        className="bg-black text-white px-3 py-1 rounded text-center"
                      >
                        💬 Chat
                      </Link>
                    </>
                  )}

                  {t.status === "on_the_way" && (
                    <button
                      onClick={() => updateStatus(t.id, "started")}
                      className="bg-indigo-600 text-white px-3 py-1 rounded"
                    >
                      Start Job
                    </button>
                  )}

                  {t.status === "started" && (
                    <button
                      onClick={() => updateStatus(t.id, "completed")}
                      className="bg-green-700 text-white px-3 py-1 rounded"
                    >
                      Complete Job
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
