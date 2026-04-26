import { Link } from "react-router-dom";
import { BadgeHelp, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { FOOTER_LINKS } from "../data/siteContent.js";

export default function AppFooter() {
  return (
    <footer className="mt-20 border-t border-white/8 bg-slate-950/40">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-12 px-6 py-12 lg:flex-row lg:justify-between">
        <div className="max-w-md">
          <div className="inline-flex items-center gap-3">
            <div className="brand-mark flex size-12 items-center justify-center rounded-2xl text-lg font-bold">
              <img src="/icons/bee-mark.svg" alt="FixBee bee" className="size-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-white">FixBee</p>
              <p className="text-sm text-slate-400">Everyday service support</p>
            </div>
          </div>
          <p className="mt-5 text-sm leading-7 text-slate-400">
            Book trusted services, follow job progress, and keep customers, workers, and admins connected in one place.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white">
              <ShieldCheck className="size-4 text-amber-100" />
              Verified access
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white">
              <Sparkles className="size-4 text-emerald-200" />
              Real-time updates
            </div>
          </div>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Company</p>
            <div className="mt-4 space-y-3">
              {FOOTER_LINKS.map((link) => (
                <Link key={link.href} to={link.href} className="block text-sm text-slate-300 transition hover:text-white">
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Support</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>albinbijoy4321@gmail.com</p>
              <p>+91 8075903584</p>
              <p>7 AM - 10 PM IST</p>
              <Link to="/faq" className="inline-flex items-center gap-2 text-amber-200 transition hover:text-amber-100">
                <BadgeHelp className="size-4" />
                Help center
              </Link>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Platform notes</p>
            <div className="mt-4 space-y-3 text-sm text-slate-300">
              <p>Customer, worker, and admin dashboards</p>
              <p>Open email signup and login</p>
              <p>Live booking, worker, and admin sync</p>
            </div>
            <a href="mailto:albinbijoy4321@gmail.com" className="mt-4 inline-flex items-center gap-2 text-sm text-amber-200">
              Talk to the operations team
              <Mail className="size-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
