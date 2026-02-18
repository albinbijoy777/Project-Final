import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

const services = [
  { name: "Electrical", icon: "⚡" },
  { name: "Plumbing", icon: "🚿" },
  { name: "Cleaning", icon: "🧹" },
  { name: "AC Repair", icon: "❄️" },
];

export default function Dashboard() {
  return (
    <>
      <Navbar />

      {/* Hero */}
      <section className="bg-yellow-100 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            Book trusted home services instantly
          </h1>
          <p className="text-gray-700 mb-6">
            Professional technicians • Transparent pricing • Fast service
          </p>

          <Link
            to="/book"
            className="inline-block bg-black text-white px-6 py-3 rounded hover:bg-gray-800"
          >
            Book a Service
          </Link>
        </div>
      </section>

      {/* Services */}
      <section className="max-w-7xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-bold mb-6">Popular Services</h2>

        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6">
          {services.map((service) => (
            <Link
              key={service.name}
              to="/book"
              className="bg-white shadow rounded p-6 text-center hover:shadow-lg transition"
            >
              <div className="text-4xl mb-3">{service.icon}</div>
              <h3 className="font-semibold">{service.name}</h3>
            </Link>
          ))}
        </div>
      </section>

      {/* Active Bookings */}
      <section className="bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold mb-4">Your Bookings</h2>

          <div className="bg-white p-6 rounded shadow">
            <p className="text-gray-500 mb-4">
              You currently have no active bookings.
            </p>

            <Link
              to="/bookings"
              className="text-yellow-600 font-medium hover:underline"
            >
              View booking history →
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
