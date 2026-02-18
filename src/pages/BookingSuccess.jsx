import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

export default function BookingSuccess() {
  return (
    <>
      <Navbar />

      <section className="min-h-screen flex items-center justify-center bg-green-50">
        <div className="bg-white p-8 rounded shadow text-center max-w-md">
          <h1 className="text-3xl font-bold text-green-600 mb-4">
            Booking Confirmed 🎉
          </h1>
          <p className="text-gray-600 mb-6">
            Your service has been successfully booked.
            Our team will assign a technician shortly.
          </p>

          <div className="flex justify-center gap-4">
            <Link
              to="/bookings"
              className="bg-black text-white px-4 py-2 rounded hover:bg-gray-800"
            >
              My Bookings
            </Link>
            <Link
              to="/dashboard"
              className="border px-4 py-2 rounded hover:bg-gray-100"
            >
              Home
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
