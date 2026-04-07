import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, KeyRound, ShieldCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { getDashboardPath } from "../../utils/routes.js";

export default function ResetPasswordPage() {
  const { loading, profile, updatePassword, user } = useAuth();
  const { pushToast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const passwordsMatch = useMemo(
    () => Boolean(form.password) && form.password === form.confirmPassword,
    [form.confirmPassword, form.password]
  );

  function handleChange(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!passwordsMatch) {
      pushToast({
        title: "Passwords do not match",
        message: "Use the same password in both fields before continuing.",
        type: "error",
      });
      return;
    }

    setSubmitting(true);

    try {
      await updatePassword(form.password);
      pushToast({
        title: "Password updated",
        message: "Your new password is active. You can continue into the app now.",
        type: "success",
      });
      navigate(getDashboardPath(profile?.role), { replace: true });
    } catch (error) {
      pushToast({
        title: "Password reset failed",
        message: error.message || "We could not update the password right now.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-6 py-10">
      <div className="panel w-full max-w-xl rounded-[34px] p-8 sm:p-10">
        <div className="inline-flex rounded-2xl bg-emerald-400/12 p-3 text-emerald-200">
          <KeyRound className="size-5" />
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.28em] text-amber-200/80">Recovery access</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Choose a new password</h1>
        <p className="mt-4 text-sm leading-7 text-slate-300">
          Open this page from the reset email, then save a new password for your
          {" "}
          <span className="font-medium text-white">@kristujayanti.com</span>
          {" "}
          account.
        </p>

        {loading ? (
          <div className="mt-8 rounded-[26px] border border-white/10 bg-white/5 p-6 text-sm text-slate-300">
            Validating your recovery session...
          </div>
        ) : user ? (
          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="password">
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                minLength={8}
                value={form.password}
                onChange={handleChange}
                className="input-shell w-full rounded-2xl px-4 py-3.5"
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label className="mb-2 block text-sm text-slate-300" htmlFor="confirmPassword">
                Confirm password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                minLength={8}
                value={form.confirmPassword}
                onChange={handleChange}
                className="input-shell w-full rounded-2xl px-4 py-3.5"
                placeholder="Repeat the password"
              />
            </div>

            {!passwordsMatch && form.confirmPassword ? (
              <div className="rounded-2xl border border-rose-300/20 bg-rose-400/8 px-4 py-3 text-sm text-rose-100">
                The two passwords must match exactly.
              </div>
            ) : null}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-emerald-300 px-4 py-3.5 text-sm font-semibold text-slate-950 transition hover:brightness-105 disabled:opacity-70"
            >
              {submitting ? "Saving..." : "Save new password"}
              <ArrowRight className="size-4" />
            </button>
          </form>
        ) : (
          <div className="mt-8 rounded-[26px] border border-white/10 bg-white/5 p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-amber-300/12 p-3 text-amber-200">
                <ShieldCheck className="size-5" />
              </div>
              <div>
                <p className="text-base font-semibold text-white">Recovery link required</p>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Open the password reset email first, then use the link inside it to reach this page with a valid recovery session.
                </p>
                <Link
                  to="/forgot-password"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-amber-200 transition hover:text-amber-100"
                >
                  Request a fresh reset email
                  <ArrowRight className="size-4" />
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
