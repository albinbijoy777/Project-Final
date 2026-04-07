import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BriefcaseBusiness,
  CalendarCheck2,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { motion as Motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { APPROVED_EMAIL_DOMAIN } from "../../utils/email.js";
import { getDashboardPath } from "../../utils/routes.js";
import AppFooter from "../../components/AppFooter.jsx";

const PLATFORM_POINTS = [
  {
    icon: CalendarCheck2,
    title: "Simple booking",
    text: "Browse services, choose a slot, and confirm a booking in a few steps.",
  },
  {
    icon: Wrench,
    title: "Live assignment",
    text: "Workers receive jobs, update status, and stay aligned with the operations team.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Operations control",
    text: "Admins can manage people, bookings, and service availability from one dashboard.",
  },
];

export default function LoginPage() {
  const { login } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);
  const targetPath = location.state?.from;

  useEffect(() => {
    setForm({ email: "", password: "" });

    function clearSavedValues() {
      if (emailRef.current) {
        emailRef.current.value = "";
      }

      if (passwordRef.current) {
        passwordRef.current.value = "";
      }
    }

    clearSavedValues();
    const frameId = window.requestAnimationFrame(clearSavedValues);
    const timeoutId = window.setTimeout(clearSavedValues, 180);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, []);

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      const profile = await login(form.email, form.password);
      pushToast({
        title: "Welcome back",
        message: "Your dashboard is connected and ready.",
        type: "success",
      });
      navigate(targetPath || getDashboardPath(profile?.role), { replace: true });
    } catch (error) {
      const message =
        error.message === "Email not confirmed"
          ? "This account is waiting for email confirmation. Disable Confirm email in Supabase for instant signup login, or confirm the email first."
          : error.message || "Please check your credentials and try again.";

      pushToast({
        title: "Unable to sign in",
        message,
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page-shell min-h-screen">
      <div className="hero-orb left-[-6rem] top-10 h-56 w-56 bg-amber-300/16" />
      <div className="hero-orb bottom-8 right-[-5rem] h-64 w-64 bg-yellow-100/12" />

      <div className="mx-auto grid min-h-screen w-full max-w-7xl gap-8 px-6 py-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-8">
        <section className="mesh-bg relative overflow-hidden rounded-[36px] border border-white/10 p-8 sm:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.03),transparent_38%),radial-gradient(circle_at_bottom_right,rgba(147,197,253,0.08),transparent_30%)]" />
          <div className="relative flex h-full flex-col justify-between gap-12">
            <div>
              <Link to="/login" className="inline-flex items-center gap-3">
                <div className="brand-mark flex size-12 items-center justify-center rounded-2xl text-lg font-bold">
                  <img src="/icons/bee-mark.svg" alt="FixBee bee" className="size-8" />
                </div>
                <div>
                  <p className="text-base font-semibold text-white">FixBee</p>
                  <p className="text-xs text-slate-400">Trusted home services</p>
                </div>
              </Link>

              <div className="mt-16 max-w-2xl">
                <span className="inline-flex rounded-full border border-amber-200/20 bg-amber-300/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.22em] text-amber-100">
                  Kristu Jayanti only
                </span>
                <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
                  Home services that feel organized from the first login.
                </h1>
                <p className="mt-6 max-w-xl text-sm leading-7 text-slate-300">
                  FixBee connects customers, workers, and admins in one smooth flow for booking, assignment, tracking, and support.
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {PLATFORM_POINTS.map((item) => (
                <InfoTile key={item.title} {...item} />
              ))}
            </div>
          </div>
        </section>

        <section className="flex items-center">
          <Motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="panel mx-auto w-full max-w-xl rounded-[36px] p-7 sm:p-8"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.28em] text-slate-500">Sign in</p>
                <h2 className="mt-3 text-3xl font-semibold text-white">Welcome back</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Use your approved university email to continue to your user, worker, or admin dashboard.
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
                Live
              </span>
            </div>

            <div className="mt-6 rounded-[26px] border border-amber-200/15 bg-amber-300/8 p-4">
              <div className="flex items-start gap-3">
                <div className="rounded-2xl bg-amber-300/12 p-3 text-amber-100">
                  <ShieldCheck className="size-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">Domain restriction is active</p>
                  <p className="mt-2 text-sm leading-6 text-slate-300">
                    Only <span className="font-medium text-white">{APPROVED_EMAIL_DOMAIN}</span> email addresses can sign in, register, or request password recovery.
                  </p>
                </div>
              </div>
            </div>

            <form className="mt-8 space-y-4" onSubmit={handleSubmit} autoComplete="off">
              <div>
                <label className="mb-2 block text-sm text-slate-300" htmlFor="email">
                  University email
                </label>
                <input
                  ref={emailRef}
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={handleChange}
                  className="input-shell w-full rounded-2xl px-4 py-3.5"
                  placeholder={`name${APPROVED_EMAIL_DOMAIN}`}
                  autoComplete="off"
                  spellCheck="false"
                />
              </div>
              <div>
                <div className="mb-2 flex items-center justify-between gap-4">
                  <label className="block text-sm text-slate-300" htmlFor="password">
                    Password
                  </label>
                  <Link to="/forgot-password" className="text-sm text-amber-200 transition hover:text-amber-100">
                    Forgot password?
                  </Link>
                </div>
                <input
                  ref={passwordRef}
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                  className="input-shell w-full rounded-2xl px-4 py-3.5"
                  placeholder="Enter your password"
                  autoComplete="off"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition hover:brightness-105 disabled:opacity-70"
              >
                {submitting ? "Signing in..." : "Sign in"}
                <ArrowRight className="size-4" />
              </button>
            </form>

            <div className="mt-8 rounded-[28px] border border-white/8 bg-white/4 p-4">
              <p className="text-sm font-semibold text-white">What you can do here</p>
              <p className="mt-2 text-sm leading-6 text-slate-400">
                Sign in to browse services, create bookings, follow status changes, and manage your profile from one place.
              </p>
            </div>

            <p className="mt-6 text-sm text-slate-400">
              Need a new user or worker account?{" "}
              <Link to="/signup" className="font-medium text-amber-200 transition hover:text-amber-100">
                Create one here
              </Link>
            </p>
          </Motion.div>
        </section>
      </div>

      <AppFooter />
    </div>
  );
}

function InfoTile({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-slate-950/35 p-4 backdrop-blur">
      <div className="inline-flex rounded-2xl bg-amber-300/12 p-3 text-amber-100">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
