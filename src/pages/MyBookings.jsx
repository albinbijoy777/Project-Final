import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import BookingTimeline from "../components/BookingTimeline";
import { Link } from "react-router-dom";

export default function MyBookings() {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchBookings();
  }, [user]);

  const fetchBookings = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (!error) setBookings(data || []);
    setLoading(false);
  };

  const cancelBooking = async (id) => {
    await supabase
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", id);

    fetchBookings();
  };

  const rescheduleBooking = async (id) => {
    if (!newDate || !newTime) return;

    const [h, m] = newTime.split(":");
    const total = parseInt(h) * 60 + parseInt(m) + 30;
    const etaH = Math.floor(total / 60) % 24;
    const etaM = total % 60;

    const eta = `${etaH.toString().padStart(2, "0")}:${etaM
      .toString()
      .padStart(2, "0")}`;

    await supabase
      .from("bookings")
      .update({
        service_date: newDate,
        service_time: newTime,
        estimated_arrival: eta,
        status: "pending",
      })
      .eq("id", id);

    setEditingId(null);
    setNewDate("");
    setNewTime("");
    fetchBookings();
  };

  const payBooking = async (id) => {
    await supabase.from("bookings").update({ paid: true }).eq("id", id);
    fetchBookings();
  };

  return (
    <>
      <Navbar />

      <div className="max-w-6xl mx-auto px-6 py-12 min-h-screen">
        <h1 className="text-3xl font-bold mb-8">My Bookings</h1>

        {loading && <p className="text-gray-500">Loading bookings...</p>}

        {!loading && bookings.length === 0 && (
          <p className="text-gray-500">You have no bookings yet.</p>
        )}

        <div className="space-y-6">
          {bookings.map((b) => (
            <div key={b.id} className="bg-white p-6 rounded-lg shadow-md">
              {/* Header */}
              <div className="flex flex-col md:flex-row md:justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">{b.service}</h2>
                  <p className="text-sm text-gray-500">
                    {b.service_date} • {b.service_time}
                  </p>
                  <p className="text-sm mt-1">
                    ETA:{" "}
                    <span className="font-semibold">
                      {b.estimated_arrival || "TBD"}
                    </span>
                  </p>
                  <p className="text-sm mt-1">
                    Status:{" "}
                    <span className="font-semibold capitalize">
                      {b.status.replace("_", " ")}
                    </span>
                  </p>

                  <p className="mt-2 font-semibold">₹{b.price}</p>

                  <BookingTimeline status={b.status} />
                </div>

                {/* ACTIONS */}
                <div className="flex gap-4 items-start">
                  {/* Pending → Reschedule & Cancel */}
                  {b.status === "pending" && (
                    <>
                      <button
                        onClick={() => setEditingId(b.id)}
                        className="text-blue-600 hover:underline"
                      >
                        Reschedule
                      </button>
                      <button
                        onClick={() => cancelBooking(b.id)}
                        className="text-red-600 hover:underline"
                      >
                        Cancel
                      </button>
                    </>
                  )}

                  {/* Confirmed → Chat */}
                  {b.status === "confirmed" && b.technician_id && (
                    <Link
                      to={`/chat/${b.id}`}
                      className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
                    >
                      💬 Chat with Technician
                    </Link>
                  )}
                </div>
              </div>

              {/* Reschedule Inputs */}
              {editingId === b.id && b.status === "pending" && (
                <div className="mt-4 flex flex-col md:flex-row gap-4">
                  <input
                    type="date"
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="border p-2 rounded"
                  />
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="border p-2 rounded"
                  />
                  <button
                    onClick={() => rescheduleBooking(b.id)}
                    className="bg-black text-white px-4 py-2 rounded"
                  >
                    Save
                  </button>
                </div>
              )}

              {/* Payment */}
              {b.status === "completed" && !b.paid && (
                <button
                  onClick={() => payBooking(b.id)}
                  className="mt-4 bg-green-600 text-white px-4 py-2 rounded"
                >
                  Pay ₹{b.price}
                </button>
              )}

              {/* Invoice */}
              {b.paid && (
                <div className="mt-4 border-t pt-3 text-sm text-gray-600">
                  <p>
                    <b>Invoice ID:</b> {b.id.slice(0, 8)}
                  </p>
                  <p>
                    <b>Service:</b> {b.service}
                  </p>
                  <p>
                    <b>Amount Paid:</b> ₹{b.price}
                  </p>
                  <p className="text-green-700 font-semibold mt-1">
                    Payment Successful ✔
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </>
  );
}
