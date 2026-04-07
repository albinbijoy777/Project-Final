import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import { LayoutDashboard, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";
import { motion as Motion } from "framer-motion";
import NotificationCenter from "./NotificationCenter.jsx";
import { useAuth } from "../context/AuthContext.jsx";
import { ROLE_MEDIA } from "../data/serviceCatalog.js";
import AvatarUploader from "./AvatarUploader.jsx";

const THEME = {
  user: {
    border: "border-amber-100/20",
    bg: "from-[#2c1d0d] via-[#2c1d0d]/90 to-[#5a421f]/70",
    badge: "bg-amber-100 text-amber-950",
  },
  worker: {
    border: "border-yellow-100/20",
    bg: "from-[#2a1d10] via-[#2a1d10]/90 to-[#6a5225]/70",
    badge: "bg-yellow-100 text-yellow-950",
  },
  admin: {
    border: "border-orange-100/20",
    bg: "from-[#24180d] via-[#24180d]/90 to-[#7a5421]/70",
    badge: "bg-orange-100 text-orange-950",
  },
};

export default function DashboardLayout({ role, title, subtitle, navItems, onAvatarUpload }) {
  const { profile, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const theme = THEME[role] || THEME.user;

  async function handleLogout() {
    try {
      await logout();
    } finally {
      setSidebarOpen(false);
      window.location.replace("/login");
    }
  }

  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-[1760px] gap-5 px-3 py-3 sm:px-4 lg:gap-6 lg:px-6">
        <AnimateSidebar
          open={sidebarOpen}
          role={role}
          profile={profile}
          navItems={navItems}
          logout={handleLogout}
          onClose={() => setSidebarOpen(false)}
          onAvatarUpload={onAvatarUpload}
        />

        <aside className="panel sticky top-3 hidden h-[calc(100vh-1.5rem)] w-[320px] flex-col overflow-y-auto rounded-[34px] xl:w-[340px] lg:flex">
          <SidebarContent
            role={role}
            profile={profile}
            navItems={navItems}
            logout={handleLogout}
            onAvatarUpload={onAvatarUpload}
          />
        </aside>

        <main className="min-w-0 flex-1">
          <header
            className={`panel relative isolate overflow-visible rounded-[34px] border ${theme.border} bg-gradient-to-br ${theme.bg} p-6 sm:p-8`}
          >
            <div
              className="pointer-events-none absolute inset-0 bg-cover bg-center opacity-20"
              style={{ backgroundImage: `url(${ROLE_MEDIA[role]?.image})` }}
            />
            <div className="pointer-events-none absolute inset-0 rounded-[34px] bg-gradient-to-r from-[#24180d] via-[#24180d]/70 to-[#24180d]/40" />
            <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${theme.badge}`}>
                  {role} dashboard
                </span>
                <h1 className="mt-4 text-3xl font-semibold text-white sm:text-4xl">{title}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300">{subtitle}</p>
              </div>

              <div className="grid gap-3 lg:min-w-[280px]">
                <div className="rounded-[28px] border border-white/10 bg-[#2a1d10]/55 p-4 backdrop-blur">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Signed in as</p>
                  <p className="mt-2 text-base font-semibold text-white">{profile?.name || "FixBee member"}</p>
                  <p className="mt-1 text-sm text-slate-400">{profile?.email}</p>
                </div>
                <div className="relative z-[90] flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setSidebarOpen(true)}
                    className="button-secondary inline-flex rounded-2xl p-3 text-slate-200 lg:hidden"
                  >
                    <Menu className="size-5" />
                  </button>
                  <NotificationCenter />
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-100"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </div>
          </header>

          <div key={location.pathname} className="page-fade pb-12 pt-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function AnimateSidebar({ open, ...props }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex bg-slate-950/70 lg:hidden">
      <Motion.aside
        initial={{ x: -40, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -40, opacity: 0 }}
        className="panel h-full w-[min(88vw,320px)] overflow-y-auto rounded-r-[32px]"
      >
        <div className="flex items-center justify-between px-6 py-5">
          <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-500">Navigation</p>
          <button
            type="button"
            onClick={props.onClose}
            className="rounded-full p-2 text-slate-300 transition hover:bg-white/6 hover:text-white"
          >
            <X className="size-5" />
          </button>
        </div>
        <SidebarContent {...props} />
      </Motion.aside>
      <button type="button" onClick={props.onClose} className="flex-1" aria-label="Close sidebar" />
    </div>
  );
}

function SidebarContent({ role, profile, navItems, onAvatarUpload }) {
  return (
    <div className="flex min-h-full flex-col gap-4 p-5">
      <Link to={`/${role}`} className="flex items-center gap-3 rounded-[28px] border border-white/8 bg-white/4 px-4 py-4">
        <div className="brand-mark flex size-12 items-center justify-center rounded-2xl text-lg font-bold">
          <img src="/icons/bee-mark.svg" alt="FixBee bee" className="size-8" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">FixBee</p>
          <p className="text-xs text-slate-500">Service operations dashboard</p>
        </div>
      </Link>

      <div className="rounded-[28px] border border-white/8 bg-white/4 p-4">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-500">Profile</p>
        <AvatarUploader
          name={profile?.name}
          avatarUrl={profile?.avatar_url || profile?.avatar}
          onUpload={onAvatarUpload}
        />
        <p className="mt-4 text-lg font-semibold text-white">{profile?.name || "FixBee member"}</p>
        <p className="text-sm text-slate-400">{profile?.email}</p>
      </div>

      <div className="rounded-[28px] border border-white/8 bg-white/4 p-4">
        <p className="px-2 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">Navigation</p>
        <nav className="mt-3 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition ${
                  isActive
                    ? "bg-white text-slate-950 shadow-lg shadow-amber-300/10"
                    : "text-slate-300 hover:bg-white/6 hover:text-white"
                }`
              }
            >
              <item.icon className="size-4" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-5 border-t border-white/8 pt-5">
          <div className="rounded-[28px] border border-white/8 bg-white/4 p-4 text-sm text-slate-400">
            <div className="flex items-center gap-2 text-slate-200">
              <LayoutDashboard className="size-4" />
              Dashboard status
            </div>
            <p className="mt-2 leading-6">
              Bookings, profile changes, and alerts stay in sync so every role sees the latest information.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
