import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { supabase } from "../services/supabase";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const prices = {
  Electrical: 500,
  Plumbing: 400,
  Cleaning: 300,
  "AC Repair": 800,
  Painting: 1000,
};

export default function BookService() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    service: "",
    date: "",
    time: "",
    address: "",
    notes: "",
  });

  const price = prices[form.service] || 0;

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
  e.preventDefault();

  // Calculate ETA (+30 mins)
  const [h, m] = form.time.split(":");
  const etaHour = (parseInt(h) + Math.floor((parseInt(m) + 30) / 60)) % 24;
  const etaMin = (parseInt(m) + 30) % 60;
  const eta = `${etaHour.toString().padStart(2, "0")}:${etaMin
    .toString()
    .padStart(2, "0")}`;

  const { error } = await supabase.from("bookings").insert({
    user_id: user.id,
    service: form.service,
    service_date: form.date,
    service_time: form.time,
    address: form.address,
    notes: form.notes,
    price,
    estimated_arrival: eta,
    status: "pending",
  });

  if (!error) navigate("/booking-success");
};


  return (
    <>
      <Navbar />

      <div className="max-w-3xl mx-auto px-6 py-12">
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded shadow"
        >
          <h1 className="text-2xl font-bold mb-6">Book a Service</h1>

          <select
            name="service"
            required
            onChange={handleChange}
            className="w-full border p-2 mb-4 rounded"
          >
            <option value="">Select Service</option>
            {Object.keys(prices).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>

          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <input type="date" name="date" required onChange={handleChange} className="border p-2 rounded" />
            <input type="time" name="time" required onChange={handleChange} className="border p-2 rounded" />
          </div>

          <textarea name="address" required onChange={handleChange} className="border p-2 rounded w-full mb-4" placeholder="Service Address" />
          <textarea name="notes" onChange={handleChange} className="border p-2 rounded w-full mb-4" placeholder="Notes (optional)" />

          <div className="mb-4 font-semibold">
            Estimated Price: ₹{price}
          </div>

          <button className="w-full bg-black text-white py-3 rounded">
            Confirm Booking
          </button>
        </form>
      </div>

      <Footer />
    </>
  );
}
