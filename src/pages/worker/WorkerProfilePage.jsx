import { useEffect, useState } from "react";
import { BriefcaseBusiness, Save } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { listWorkerBookings } from "../../services/platformService.js";
import AvatarUploader from "../../components/AvatarUploader.jsx";
import StatCard from "../../components/StatCard.jsx";
import WorkerCoverageFields from "../../components/WorkerCoverageFields.jsx";
import { extractGooglePlaceSelection } from "../../utils/location.js";
import { getDistrictsForState } from "../../data/indiaLocations.js";

export default function WorkerProfilePage() {
  const { profile, updateProfile, updateAvatar, user } = useAuth();
  const { pushToast } = useToast();
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
    isAcceptingJobs: true,
  });
  const [saving, setSaving] = useState(false);
  const [jobCount, setJobCount] = useState(0);

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
      isAcceptingJobs: profile?.is_accepting_jobs !== false,
    });
  }, [
    profile?.address,
    profile?.is_accepting_jobs,
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

  function handleCoverageStateChange(nextState) {
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

  function handleCoverageDistrictToggle(nextDistrict) {
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

  function handleCoveragePlaceSelect(place) {
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

    if (!form.workerServiceState || !form.workerServiceDistricts.length) {
      pushToast({
        title: "Coverage area required",
        message: "Choose at least one district where you can take service requests.",
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
        workerServiceState: form.workerServiceState,
        workerServiceDistricts: form.workerServiceDistricts,
        workerServiceLocation: form.workerServiceLocation,
        workerServicePlaceId: form.workerServicePlaceId,
        workerServiceLatitude: form.workerServiceLatitude,
        workerServiceLongitude: form.workerServiceLongitude,
        isAcceptingJobs: form.isAcceptingJobs,
      });
      pushToast({
        title: "Worker profile saved",
        message: "Your contact details, coverage districts, and live availability are updated in real time.",
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
            Keep your profile photo, coverage area, and availability current so admin can route work with confidence.
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
            <WorkerCoverageFields
              state={form.workerServiceState}
              districts={form.workerServiceDistricts}
              locationText={form.workerServiceLocation}
              onStateChange={handleCoverageStateChange}
              onDistrictToggle={handleCoverageDistrictToggle}
              onLocationTextChange={(value) =>
                setForm((current) => ({
                  ...current,
                  workerServiceLocation: value,
                }))
              }
              onPlaceSelect={handleCoveragePlaceSelect}
              availability={form.isAcceptingJobs}
              onAvailabilityChange={(value) =>
                setForm((current) => ({
                  ...current,
                  isAcceptingJobs: value,
                }))
              }
              showAvailability
            />
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
