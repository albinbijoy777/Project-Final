import { useEffect, useState } from "react";
import { CalendarCheck2, CalendarRange, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { listUserBookings, peekUserBookingsCache, subscribeToTable } from "../../services/platformService.js";
import AvatarUploader from "../../components/AvatarUploader.jsx";
import StatCard from "../../components/StatCard.jsx";
import WorkerCoverageFields from "../../components/WorkerCoverageFields.jsx";
import { extractGooglePlaceSelection } from "../../utils/location.js";
import { getDistrictsForState } from "../../data/indiaLocations.js";
import { isPendingWorkerApplication, isRejectedWorkerApplication } from "../../utils/profile.js";

export default function UserProfilePage() {
  const { profile, updateProfile, updateAvatar, user } = useAuth();
  const { pushToast } = useToast();
  const cachedBookings = peekUserBookingsCache(user?.id);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    workerServiceState: "",
    workerServiceDistricts: [],
    workerServiceLocation: "",
    workerServicePlaceId: "",
    workerServiceLatitude: "",
    workerServiceLongitude: "",
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
      workerServiceState: profile?.worker_service_state || "",
      workerServiceDistricts: profile?.worker_service_districts || [],
      workerServiceLocation: profile?.worker_service_location || "",
      workerServicePlaceId: profile?.worker_service_place_id || "",
      workerServiceLatitude: profile?.worker_service_latitude || "",
      workerServiceLongitude: profile?.worker_service_longitude || "",
    });
  }, [
    profile?.address,
    profile?.name,
    profile?.phone,
    profile?.worker_service_districts,
    profile?.worker_service_latitude,
    profile?.worker_service_location,
    profile?.worker_service_longitude,
    profile?.worker_service_place_id,
    profile?.worker_service_state,
  ]);

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

  function handleWorkerStateChange(nextState) {
    const nextDistrictOptions = getDistrictsForState(nextState);
    setForm((current) => ({
      ...current,
      workerServiceState: nextState,
      workerServiceDistricts: current.workerServiceDistricts.filter((district) =>
        nextDistrictOptions.includes(district)
      ).length
        ? current.workerServiceDistricts.filter((district) => nextDistrictOptions.includes(district))
        : nextDistrictOptions.slice(0, 1),
    }));
  }

  function handleWorkerDistrictToggle(nextDistrict) {
    setForm((current) => {
      const alreadySelected = current.workerServiceDistricts.includes(nextDistrict);

      if (alreadySelected && current.workerServiceDistricts.length === 1) {
        return current;
      }

      return {
        ...current,
        workerServiceDistricts: alreadySelected
          ? current.workerServiceDistricts.filter((district) => district !== nextDistrict)
          : [...current.workerServiceDistricts, nextDistrict],
      };
    });
  }

  function handleWorkerPlaceSelect(place) {
    const nextSelection = extractGooglePlaceSelection(place);
    setForm((current) => ({
      ...current,
      workerServiceState: nextSelection.state || current.workerServiceState,
      workerServiceDistricts: nextSelection.districts.length
        ? nextSelection.districts
        : current.workerServiceDistricts,
      workerServiceLocation: nextSelection.locationText,
      workerServicePlaceId: nextSelection.placeId,
      workerServiceLatitude: nextSelection.latitude,
      workerServiceLongitude: nextSelection.longitude,
    }));
  }

  async function handleSave(event) {
    event.preventDefault();
    const workerApplicationOpen =
      profile?.role === "user" &&
      (isPendingWorkerApplication(profile) || isRejectedWorkerApplication(profile));

    if (workerApplicationOpen && !form.workerServiceDistricts.length) {
      pushToast({
        title: "Select a worker district",
        message: "Choose at least one district before saving the worker application details.",
        type: "error",
      });
      return;
    }

    setSaving(true);
    try {
      await updateProfile({
        name: form.name,
        phone: form.phone,
        address: form.address,
        ...(workerApplicationOpen
          ? {
              workerServiceState: form.workerServiceState,
              workerServiceDistricts: form.workerServiceDistricts,
              workerServiceLocation: form.workerServiceLocation,
              workerServicePlaceId: form.workerServicePlaceId,
              workerServiceLatitude: form.workerServiceLatitude,
              workerServiceLongitude: form.workerServiceLongitude,
              workerApplicationStatus: "pending",
              workerApplicationNote: "",
              workerApplicationSubmittedAt: new Date().toISOString(),
              workerReviewedAt: null,
            }
          : {}),
      });
      pushToast({
        title: workerApplicationOpen ? "Application updated" : "Profile saved",
        message: workerApplicationOpen
          ? "Your worker application details were updated and moved back into the admin review queue."
          : "Your name, phone number, and address are updated in real time.",
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

  const workerApplicationOpen =
    profile?.role === "user" &&
    (isPendingWorkerApplication(profile) || isRejectedWorkerApplication(profile));

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
            {workerApplicationOpen ? (
              <WorkerCoverageFields
                state={form.workerServiceState}
                districts={form.workerServiceDistricts}
                locationText={form.workerServiceLocation}
                onStateChange={handleWorkerStateChange}
                onDistrictToggle={handleWorkerDistrictToggle}
                onLocationTextChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    workerServiceLocation: value,
                  }))
                }
                onPlaceSelect={handleWorkerPlaceSelect}
                title="Worker application coverage"
                description={
                  isPendingWorkerApplication(profile)
                    ? "Your worker request is waiting for admin approval. Keep the service area accurate so jobs can be matched correctly."
                    : "Update the coverage details below and save to resubmit your worker application."
                }
              />
            ) : null}
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
