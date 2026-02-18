export default function Footer() {
  return (
    <footer className="bg-black text-gray-300 mt-12">
      <div className="max-w-7xl mx-auto px-6 py-10 grid md:grid-cols-4 gap-8 text-sm">
        <div>
          <h3 className="text-yellow-400 font-bold text-lg mb-2">FixBee 🐝</h3>
          <p>
            Trusted home services at your fingertips.
            Quality technicians, transparent pricing.
          </p>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Services</h4>
          <ul className="space-y-1">
            <li>Electrical</li>
            <li>Plumbing</li>
            <li>Cleaning</li>
            <li>AC Repair</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">Support</h4>
          <ul className="space-y-1">
            <li>Help Center</li>
            <li>Contact Us</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-2">© 2026 FixBee</h4>
          <p>All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
