import { lazy, Suspense } from "react";
import { Link, Navigate, Route, Routes } from "react-router-dom";
import {
  BookCopy,
  BookOpenCheck,
  BriefcaseBusiness,
  ClipboardList,
  LayoutDashboard,
  PackageSearch,
  Settings2,
  Shield,
  ShoppingBag,
  Users,
} from "lucide-react";
import { useAuth } from "./context/AuthContext.jsx";
import { getDashboardPath } from "./utils/routes.js";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import RoleRoute from "./components/RoleRoute.jsx";
import DashboardLayout from "./components/DashboardLayout.jsx";
import AppBoot from "./components/AppBoot.jsx";

const LoginPage = lazy(() => import("./pages/auth/LoginPage.jsx"));
const RegisterPage = lazy(() => import("./pages/auth/RegisterPage.jsx"));
const StaticPage = lazy(() => import("./pages/common/StaticPage.jsx"));
const UserOverviewPage = lazy(() => import("./pages/user/UserOverviewPage.jsx"));
const UserServicesPage = lazy(() => import("./pages/user/UserServicesPage.jsx"));
const UserServiceDetailsPage = lazy(() => import("./pages/user/UserServiceDetailsPage.jsx"));
const UserBookingPage = lazy(() => import("./pages/user/UserBookingPage.jsx"));
const UserBookingsPage = lazy(() => import("./pages/user/UserBookingsPage.jsx"));
const UserProfilePage = lazy(() => import("./pages/user/UserProfilePage.jsx"));
const WorkerOverviewPage = lazy(() => import("./pages/worker/WorkerOverviewPage.jsx"));
const WorkerHistoryPage = lazy(() => import("./pages/worker/WorkerHistoryPage.jsx"));
const WorkerProfilePage = lazy(() => import("./pages/worker/WorkerProfilePage.jsx"));
const AdminOverviewPage = lazy(() => import("./pages/admin/AdminOverviewPage.jsx"));
const AdminBookingsPage = lazy(() => import("./pages/admin/AdminBookingsPage.jsx"));
const AdminServicesPage = lazy(() => import("./pages/admin/AdminServicesPage.jsx"));
const AdminPeoplePage = lazy(() => import("./pages/admin/AdminPeoplePage.jsx"));

const USER_NAV = [
  { to: "/user", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/user/services", label: "Services", icon: ShoppingBag },
  { to: "/user/bookings", label: "Bookings", icon: BookOpenCheck },
  { to: "/user/profile", label: "Profile", icon: Settings2 },
];

const WORKER_NAV = [
  { to: "/worker", label: "Assignments", icon: BriefcaseBusiness, end: true },
  { to: "/worker/history", label: "History", icon: ClipboardList },
  { to: "/worker/profile", label: "Profile", icon: Settings2 },
];

const ADMIN_NAV = [
  { to: "/admin", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/admin/bookings", label: "Bookings", icon: BookCopy },
  { to: "/admin/services", label: "Services", icon: PackageSearch },
  { to: "/admin/people", label: "People", icon: Users },
];

export default function App() {
  return (
    <Suspense fallback={<AppBoot />}>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route
          path="/login"
          element={
            <GuestGate>
              <LoginPage />
            </GuestGate>
          }
        />
        <Route
          path="/signup"
          element={
            <GuestGate>
              <RegisterPage />
            </GuestGate>
          }
        />
        <Route path="/forgot-password" element={<Navigate to="/login" replace />} />
        <Route path="/reset-password" element={<Navigate to="/login" replace />} />

        <Route path="/about" element={<StaticPage pageKey="about" />} />
        <Route path="/terms" element={<StaticPage pageKey="terms" />} />
        <Route path="/privacy" element={<StaticPage pageKey="privacy" />} />
        <Route path="/cancellation" element={<StaticPage pageKey="cancellation" />} />
        <Route path="/faq" element={<StaticPage pageKey="faq" />} />
        <Route path="/contact" element={<StaticPage pageKey="contact" />} />
        <Route path="/blog" element={<StaticPage pageKey="blog" />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<RoleRoute allowedRoles={["user"]} />}>
            <Route
              path="/user"
              element={
                <RoleWorkspace
                  role="user"
                  title="Customer dashboard"
                  subtitle="Discover services, schedule visits, apply coupons, and follow every booking in real time."
                  navItems={USER_NAV}
                />
              }
            >
              <Route index element={<UserOverviewPage />} />
              <Route path="services" element={<UserServicesPage />} />
              <Route path="services/:serviceId" element={<UserServiceDetailsPage />} />
              <Route path="book/:serviceId" element={<UserBookingPage />} />
              <Route path="bookings" element={<UserBookingsPage />} />
              <Route path="profile" element={<UserProfilePage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={["worker"]} />}>
            <Route
              path="/worker"
              element={
                <RoleWorkspace
                  role="worker"
                  title="Worker dashboard"
                  subtitle="Handle assignments, move jobs through execution, and keep your worker profile synced across the platform."
                  navItems={WORKER_NAV}
                />
              }
            >
              <Route index element={<WorkerOverviewPage />} />
              <Route path="history" element={<WorkerHistoryPage />} />
              <Route path="profile" element={<WorkerProfilePage />} />
            </Route>
          </Route>

          <Route element={<RoleRoute allowedRoles={["admin"]} />}>
            <Route
              path="/admin"
              element={
                <RoleWorkspace
                  role="admin"
                  title="Admin dashboard"
                  subtitle="Manage bookings, people, services, and analytics from one live operational dashboard."
                  navItems={ADMIN_NAV}
                />
              }
            >
              <Route index element={<AdminOverviewPage />} />
              <Route path="bookings" element={<AdminBookingsPage />} />
              <Route path="services" element={<AdminServicesPage />} />
              <Route path="people" element={<AdminPeoplePage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Suspense>
  );
}

function RootRedirect() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <AppBoot />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardPath(profile?.role || user?.user_metadata?.role)} replace />;
}

function GuestGate({ children }) {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return <AppBoot />;
  }

  if (user) {
    return <Navigate to={getDashboardPath(profile?.role || user?.user_metadata?.role)} replace />;
  }

  return children;
}

function RoleWorkspace({ role, title, subtitle, navItems }) {
  const { updateAvatar } = useAuth();

  return (
    <DashboardLayout
      role={role}
      title={title}
      subtitle={subtitle}
      navItems={navItems}
      onAvatarUpload={updateAvatar}
    />
  );
}

function NotFoundPage() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="panel max-w-xl rounded-[34px] p-8 text-center">
        <div className="mx-auto inline-flex rounded-2xl bg-rose-400/10 p-3 text-rose-200">
          <Shield className="size-6" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-white">Page not found</h1>
        <p className="mt-3 text-sm leading-7 text-slate-400">
          The page you requested is not available. Head back to the correct dashboard.
        </p>
        <div className="mt-6">
          <NavigateButton />
        </div>
      </div>
    </div>
  );
}

function NavigateButton() {
  const { user, profile } = useAuth();

  if (user) {
    return (
      <Link
        to={getDashboardPath(profile?.role)}
        className="rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950"
      >
        Return to dashboard
      </Link>
    );
  }

  return (
    <Link
      to="/login"
      className="rounded-2xl bg-gradient-to-r from-cyan-400 to-teal-400 px-5 py-3 text-sm font-semibold text-slate-950"
    >
      Go to sign in
    </Link>
  );
}
