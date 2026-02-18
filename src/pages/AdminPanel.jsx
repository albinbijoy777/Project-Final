import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../services/supabase";

export default function AdminPanel() {
  const [bookings, setBookings] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [services, setServices] = useState([]);

  const [newService, setNewService] = useState({
    name: "",
    price: "",
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
    fetchTechnicians();
    fetchServices();
  }, []);

  /* ===================== FETCH DATA ===================== */

  const fetchBookings = async () => {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error) setBookings(data || []);
    setLoading(false);
  };

  const fetchTechnicians = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, skills")
      .eq("role", "technician");

    if (!error) setTechnicians(data || []);
  };

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .order("name");

    if (!error) setServices(data || []);
  };

  /* ===================== BOOKING ACTIONS ===================== */

  const assignTechnician = async (bookingId, technicianId) => {
    if (!technicianId) return;

    await supabase
      .from("bookings")
      .update({
        technician_id: technicianId,
        status: "technician_assigned",
      })
      .eq("id", bookingId);

    fetchBookings();
  };

  const updateStatus = async (bookingId, status) => {
    await supabase
      .from("bookings")
      .update({ status })
      .eq("id", bookingId);

    fetchBookings();
  };

  /* ===================== SERVICE MANAGEMENT ===================== */

  const addService = async () => {
    if (!newService.name || !newService.price) return;

    await supabase.from("services").insert({
      name: newService.name,
      price: Number(newService.price),
    });

    setNewService({ name: "", price: "" });
    fetchServices();
  };

  const updateServicePrice = async (id, price) => {
    await supabase
      .from("services")
      .update({ price: Number(price) })
      .eq("id", id);

    fetchServices();
  };

  const deleteService = async (id) => {
    await supabase.from("services").delete().eq("id", id);
    fetchServices();
  };

  /* ===================== UI ===================== */

  return (
    <>
      <Navbar />

      <div className="max-w-7xl mx-auto px-6 py-12 min-h-screen">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        {/* ================= BOOKINGS ================= */}
        <section className="mb-16">
          <h2 className="text-xl font-semibold mb-4">Bookings</h2>

          {loading && <p>Loading bookings...</p>}

          <div className="space-y-6">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="bg-white p-6 rounded-lg shadow"
              >
                <div className="flex flex-col md:flex-row md:justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold">
                      {b.service}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {b.service_date} • {b.service_time}
                    </p>
                    <p className="text-sm mt-1">
                      Status:{" "}
                      <span className="capitalize font-semibold">
                        {b.status.replace("_", " ")}
                      </span>
                    </p>
                    <p className="mt-1 font-semibold">
                      ₹{b.price}
                    </p>
                  </div>

                  {/* ACTIONS */}
                  <div className="w-full md:w-64 space-y-2">
                    {/* Assign Technician */}
                    {b.status === "confirmed" && (
                      <select
                        onChange={(e) =>
                          assignTechnician(
                            b.id,
                            e.target.value
                          )
                        }
                        className="border p-2 rounded w-full"
                        defaultValue=""
                      >
                        <option value="">
                          Assign Technician
                        </option>

                        {technicians
                          .filter((t) =>
                            t.skills?.some(
                              (s) =>
                                s.toLowerCase() ===
                                b.service.toLowerCase()
                            )
                          )
                          .map((t) => (
                            <option
                              key={t.id}
                              value={t.id}
                            >
                              {t.email}
                            </option>
                          ))}
                      </select>
                    )}

                    {/* Status Controls */}
                    <div className="flex gap-2">
                      {b.status === "pending" && (
                        <button
                          onClick={() =>
                            updateStatus(b.id, "confirmed")
                          }
                          className="bg-black text-white px-3 py-1 rounded text-sm"
                        >
                          Confirm
                        </button>
                      )}

                      {b.status === "technician_assigned" && (
                        <button
                          onClick={() =>
                            updateStatus(b.id, "completed")
                          }
                          className="bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Mark Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ================= SERVICES ================= */}
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Manage Services
          </h2>

          {/* Add Service */}
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <input
              type="text"
              placeholder="Service Name"
              value={newService.name}
              onChange={(e) =>
                setNewService({
                  ...newService,
                  name: e.target.value,
                })
              }
              className="border p-2 rounded w-full"
            />
            <input
              type="number"
              placeholder="Price"
              value={newService.price}
              onChange={(e) =>
                setNewService({
                  ...newService,
                  price: e.target.value,
                })
              }
              className="border p-2 rounded w-full"
            />
            <button
              onClick={addService}
              className="bg-black text-white px-4 py-2 rounded"
            >
              Add Service
            </button>
          </div>

          {/* Service List */}
          <div className="space-y-3">
            {services.map((s) => (
              <div
                key={s.id}
                className="flex justify-between items-center bg-white p-4 rounded shadow"
              >
                <span className="font-medium">
                  {s.name}
                </span>

                <div className="flex items-center gap-4">
                  <input
                    type="number"
                    defaultValue={s.price}
                    onBlur={(e) =>
                      updateServicePrice(
                        s.id,
                        e.target.value
                      )
                    }
                    className="border p-1 w-24 rounded"
                  />
                  <button
                    onClick={() => deleteService(s.id)}
                    className="text-red-600 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}
