import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useAuth } from "../context/AuthContext";

export default function Profile() {
  const { user, profile } = useAuth();

  return (
    <>
      <Navbar />
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold mb-4">My Profile</h1>
        <div className="bg-white p-6 shadow rounded">
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Role:</strong> {profile.role}</p>
        </div>
      </div>
      <Footer />
    </>
  );
}
