import { useEffect, useState } from "react";
import { BriefcaseBusiness, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { listWorkerBookings } from "../../services/platformService.js";
import AvatarUploader from "../../components/AvatarUploader.jsx";
import StatCard from "../../components/StatCard.jsx";

export default function WorkerProfilePage() {
  const { profile, updateProfile, updateAvatar, user } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({ name: "", phone: "", address: "" });
  const [saving, setSaving] = useState(false);
  const [jobCount, setJobCount] = useState(0);

  useEffect(() => {
    setForm({
      name: profile?.name || "",
      phone: profile?.phone || "",
      address: profile?.address || "",
    });
  }, [profile?.address, profile?.name, profile?.phone]);

  useEffect(() => {
    if (!user?.id) return;

    async function loadJobs() {
      const bookings = await listWorkerBookings(user.id);
      setJobCount(bookings.length);
    }

    loadJobs();
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
        title: "Worker profile saved",
        message: "Your contact information has been updated in real time.",
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Update failed",
        message: error.message || "Unable to save your profile right now.",
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
        message: "Your worker photo is now stored successfully.",
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Upload failed",
        message: error.message || "Unable to upload the selected image.",
        type: "error",
      });
    }
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-grid">
        <StatCard
          icon={BriefcaseBusiness}
          label="Assigned jobs"
          value={jobCount}
          hint="Tracked across your worker dashboard"
          accent="from-teal-300 to-emerald-400"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="panel rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Worker identity</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Public worker card</h2>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Keep your profile photo and contact details current so admins can route work with confidence.
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
          <div className="grid gap-4">
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
            className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-70"
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
