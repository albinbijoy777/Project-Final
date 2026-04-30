import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import {
  getEmailFieldLabel,
  getEmailPlaceholder,
  getEmailRuleText,
} from "../../utils/email.js";
import { getDashboardPath } from "../../utils/routes.js";
import { DEFAULT_SERVICE_DISTRICT, DEFAULT_SERVICE_STATE, getDistrictsForState } from "../../data/indiaLocations.js";
import { extractGooglePlaceSelection } from "../../utils/location.js";
import WorkerCoverageFields from "../../components/WorkerCoverageFields.jsx";

const ROLES = [
  { value: "user", label: "User", description: "Book services, track updates, and manage bookings." },
  {
    value: "worker",
    label: "Worker",
    description: "Submit a worker application, set your service area, and activate your dashboard after admin approval.",
  },
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    password: "",
    role: "user",
    workerServiceState: DEFAULT_SERVICE_STATE,
    workerServiceDistricts: [DEFAULT_SERVICE_DISTRICT],
    workerServiceLocation: "",
    workerServicePlaceId: "",
    workerServiceLatitude: "",
    workerServiceLongitude: "",
  });
  const [avatarFile, setAvatarFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleRoleSelect(nextRole) {
    setForm((current) => ({
      ...current,
      role: nextRole,
    }));
  }

  function handleWorkerStateChange(nextState) {
    const nextDistricts = getDistrictsForState(nextState);
    setForm((current) => ({
      ...current,
      workerServiceState: nextState,
      workerServiceDistricts: current.workerServiceDistricts.filter((district) => nextDistricts.includes(district)).length
        ? current.workerServiceDistricts.filter((district) => nextDistricts.includes(district))
        : nextDistricts.slice(0, 1),
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

  async function handleSubmit(event) {
    event.preventDefault();

    if (form.role === "worker" && !form.workerServiceDistricts.length) {
      pushToast({
        title: "Select a service district",
        message: "Choose at least one district where the worker can take bookings.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);

    try {
      const result = await signup({ ...form, avatarFile });

      if (result?.requiresEmailConfirmation) {
        pushToast({
          title: form.role === "worker" ? "Application account created" : "Account created",
          message:
            form.role === "worker"
              ? "Confirm your email first, then sign in to track your worker application."
              : "Confirm your email first, then sign in to open the user dashboard.",
          type: "success",
        });
        navigate("/login", { replace: true });
      } else {
        pushToast({
          title: form.role === "worker" ? "Worker application submitted" : "Account created",
          message:
            form.role === "worker"
              ? "Your request is saved with coverage details and will activate after admin approval."
              : "Your profile, avatar, and dashboard are ready.",
          type: "success",
        });
        navigate(getDashboardPath(result?.profile?.role), { replace: true });
      }
    } catch (error) {
      pushToast({
        title: "Could not create account",
        message: error.message || "Please verify your details and try again.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell flex min-h-screen items-center justify-center px-6 py-10">
      <Motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="panel grid w-full max-w-6xl overflow-hidden rounded-[36px] lg:grid-cols-[0.92fr_1.08fr]"
      >
        <div className="mesh-bg border-b border-white/8 p-8 lg:border-b-0 lg:border-r lg:p-10">
          <span className="inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
            Flexible sign up
          </span>
          <h1 className="mt-6 text-4xl font-semibold text-white">Create your FixBee account</h1>
          <p className="mt-4 text-sm leading-7 text-slate-300">
            Register as a customer or worker, complete your profile, and start using the platform right away.
          </p>

          <div className="mt-8 rounded-[28px] border border-white/8 bg-slate-950/28 p-5">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-300/12 p-3 text-amber-100">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Email rule</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  {getEmailRuleText()}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            {ROLES.map((role) => (
              <button
                key={role.value}
                type="button"
                onClick={() => handleRoleSelect(role.value)}
                className={`w-full rounded-3xl border p-4 text-left transition ${
                  form.role === role.value
                    ? "border-amber-200/20 bg-amber-300/8"
                    : "border-white/8 bg-white/4 hover:bg-white/6"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-base font-semibold text-white">{role.label}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-400">{role.description}</p>
                  </div>
                  {form.role === role.value ? <CheckCircle2 className="mt-1 size-5 text-amber-100" /> : null}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="p-8 lg:p-10">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Register</p>
              <h2 className="mt-3 text-3xl font-semibold text-white">Set up your profile</h2>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                For instant login after signup, keep <span className="text-white">Confirm email</span> turned off in your Supabase Email provider settings.
              </p>
            </div>
            <Link to="/login" className="text-sm text-amber-200 transition hover:text-amber-100">
              Already have an account?
            </Link>
          </div>

          <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
            <Field label="Full name" name="name" value={form.name} onChange={handleChange} placeholder="Your name" />
            <Field
              label={getEmailFieldLabel()}
              name="email"
              type="email"
              value={form.email}
              onChange={handleChange}
              placeholder={getEmailPlaceholder()}
            />
            <Field label="Phone" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9XXXXXXXXX" />
            <Field label="Password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Create a strong password" />
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">Address</label>
              <textarea
                name="address"
                rows="3"
                value={form.address}
                onChange={handleChange}
                className="input-shell w-full rounded-2xl px-4 py-3.5"
                placeholder="Primary service address"
              />
            </div>
            {form.role === "worker" ? (
              <div className="sm:col-span-2">
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
                />
              </div>
            ) : null}
            <div className="sm:col-span-2">
              <label className="mb-2 block text-sm text-slate-300">Profile photo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setAvatarFile(event.target.files?.[0] || null)}
                className="input-shell w-full rounded-2xl px-4 py-3.5 file:mr-4 file:rounded-xl file:border-0 file:bg-amber-300/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-amber-100"
              />
            </div>
            {form.role === "worker" ? (
              <div className="sm:col-span-2 rounded-[28px] border border-amber-200/15 bg-amber-300/8 p-4">
                <div className="flex items-start gap-3">
                  <div className="rounded-2xl bg-amber-300/12 p-3 text-amber-100">
                    <AlertCircle className="size-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">Approval workflow</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      New worker signups stay in application mode until an admin approves the request. Existing workers are not affected.
                    </p>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition hover:brightness-105 disabled:opacity-70"
              >
                {submitting ? "Creating account..." : "Create account"}
                <ArrowRight className="size-4" />
              </button>
            </div>
          </form>
        </div>
      </Motion.div>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, placeholder }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        required
        className="input-shell w-full rounded-2xl px-4 py-3.5"
        placeholder={placeholder}
      />
    </div>
  );
}
