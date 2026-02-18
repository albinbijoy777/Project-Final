import Container from "../components/Container";

const services = [
  { title: "Plumbing", price: "₹499", desc: "Leaks, pipes, fittings" },
  { title: "Electrical", price: "₹399", desc: "Switches, wiring" },
  { title: "AC Repair", price: "₹999", desc: "Service & repair" },
];

export default function Services() {
  return (
    <Container>
      <h2 className="text-xl font-bold mb-4">Available Services</h2>

      <div className="grid md:grid-cols-3 gap-6">
        {services.map(s => (
          <div
            key={s.title}
            className="border rounded-xl p-5 flex flex-col justify-between bg-white"
          >
            <div>
              <h3 className="font-bold text-lg">{s.title}</h3>
              <p className="text-sm text-gray-500 mt-1">{s.desc}</p>
              <p className="mt-3 font-semibold text-yellow-600">
                Starting at {s.price}
              </p>
            </div>

            <button className="mt-6 bg-black text-white py-2 rounded hover:bg-gray-800">
              Book Now
            </button>
          </div>
        ))}
      </div>
    </Container>
  );
}
