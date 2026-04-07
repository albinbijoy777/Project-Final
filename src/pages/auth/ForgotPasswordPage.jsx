import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, MailCheck, ShieldCheck } from "lucide-react";
import { motion as Motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import { APPROVED_EMAIL_DOMAIN } from "../../utils/email.js";

export default function ForgotPasswordPage() {
  const { sendPasswordResetEmail } = useAuth();
  const { pushToast } = useToast();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);

    try {
      await sendPasswordResetEmail(email);
      pushToast({
        title: "Reset email sent",
        message: "Check your inbox for password recovery instructions.",
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Recovery failed",
        message: error.message || "Unable to send the reset email right now.",
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
        className="panel w-full max-w-xl rounded-[34px] p-8 sm:p-10"
      >
        <div className="inline-flex rounded-2xl bg-amber-300/12 p-3 text-amber-100">
          <MailCheck className="size-5" />
        </div>
        <p className="mt-6 text-sm uppercase tracking-[0.28em] text-slate-500">Password recovery</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Send a reset link</h1>
        <p className="mt-4 text-sm leading-7 text-slate-400">
          Enter your approved university email and we will send a secure reset email that opens the in-app password page.
        </p>

        <div className="mt-6 rounded-[26px] border border-white/10 bg-white/5 p-4">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-emerald-400/12 p-3 text-emerald-200">
              <ShieldCheck className="size-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">Allowed email format</p>
              <p className="mt-2 text-sm leading-6 text-slate-300">
                Only <span className="font-medium text-white">{APPROVED_EMAIL_DOMAIN}</span> accounts can request password recovery.
              </p>
            </div>
          </div>
        </div>

        <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-2 block text-sm text-slate-300">University email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="input-shell w-full rounded-2xl px-4 py-3.5"
              placeholder={`name${APPROVED_EMAIL_DOMAIN}`}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="button-primary inline-flex w-full items-center justify-center gap-2 rounded-2xl px-4 py-3.5 text-sm font-semibold transition hover:brightness-105 disabled:opacity-70"
          >
            {submitting ? "Sending..." : "Send reset link"}
            <ArrowRight className="size-4" />
          </button>
        </form>

        <p className="mt-6 text-sm text-slate-400">
          Remembered it?{" "}
          <Link to="/login" className="font-medium text-amber-200 transition hover:text-amber-100">
            Return to sign in
          </Link>
        </p>
      </Motion.div>
    </div>
  );
}
