import { useEffect, useState } from "react";
import { CalendarCheck2, CalendarRange, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { listUserBookings, peekUserBookingsCache, subscribeToTable } from "../../services/platformService.js";
import AvatarUploader from "../../components/AvatarUploader.jsx";
import StatCard from "../../components/StatCard.jsx";

export default function UserProfilePage() {
  const { profile, updateProfile, updateAvatar, user } = useAuth();
  const { pushToast } = useToast();
  const cachedBookings = peekUserBookingsCache(user?.id);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
  });
  const [saving, setSaving] = useState(false);
  const [stats, setStats] = useState({
    upcomingBookings: cachedBookings?.filter((booking) => booking.status !== "completed").length || 0,
    completedJobs: 0,
    totalBookings: cachedBookings?.length || 0,
  });

  useEffect(() => {
    setForm({
      name: profile?.name || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    });
  }, [profile?.address, profile?.name, profile?.phone]);

  useEffect(() => {
    if (!user?.id) return undefined;

    async function loadStats() {
      const bookings = await listUserBookings(user.id);

      setStats({
        upcomingBookings: bookings.filter((booking) => booking.status !== "completed").length,
        completedJobs: bookings.filter((booking) => booking.status === "completed").length,
        totalBookings: bookings.length,
      });
    }

    loadStats();

    return subscribeToTable({
      channelName: `user-profile-bookings-${user.id}`,
      table: "bookings",
      filter: `user_id=eq.${user.id}`,
      onChange: () => loadStats(),
    });
  }, [user?.id]);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    setSaving(true);
    try {
      await updateProfile(form);
      pushToast({
        title: "Profile saved",
        message: "Your name, phone number, and address are updated in real time.",
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Update failed",
        message: error.message || "We could not save your profile right now.",
        type: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleAvatarUpload(file) {
    try {
      await updateAvatar(file);
      pushToast({
        title: "Avatar updated",
        message: "Your new profile photo is now saved to storage.",
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Upload failed",
        message: error.message || "Unable to upload your avatar right now.",
        type: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-grid">
        <StatCard
          icon={CalendarRange}
          label="Upcoming bookings"
          value={stats.upcomingBookings}
          hint="Active and upcoming visits"
          accent="from-amber-300 to-orange-400"
        />
        <StatCard
          icon={CalendarCheck2}
          label="Completed bookings"
          value={stats.completedJobs}
          hint="Successfully delivered services"
          accent="from-teal-300 to-emerald-400"
        />
        <StatCard
          icon={Save}
          label="Total bookings"
          value={stats.totalBookings}
          hint="All recorded service requests"
          accent="from-sky-300 to-cyan-400"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="panel rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Account identity</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Profile and avatar</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Keep your name, photo, and contact details current so every booking uses the right information.
          </p>
          <div className="mt-8">
            <AvatarUploader
              name={profile?.name}
              avatarUrl={profile?.avatar_url || profile?.avatar}
              onUpload={handleAvatarUpload}
            />
          </div>
        </div>

        <form className="panel rounded-[32px] p-6" onSubmit={handleSave}>
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Editable fields</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Profile details</h2>

          <div className="mt-8 grid gap-4">
            <Field label="Full name" name="name" value={form.name} onChange={handleChange} />
            <Field label="Phone number" name="phone" value={form.phone} onChange={handleChange} />
            <div>
              <label className="mb-2 block text-sm text-slate-300">Address</label>
              <textarea
                name="address"
                rows="4"
                value={form.address}
                onChange={handleChange}
                className="input-shell w-full rounded-2xl px-4 py-3.5"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save changes"}
            <Save className="size-4" />
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, name, value, onChange }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <input
        name={name}
        value={value}
        onChange={onChange}
        className="input-shell w-full rounded-2xl px-4 py-3.5"
      />
    </div>
  );
}
