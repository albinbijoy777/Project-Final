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
import LoginPage from "./pages/auth/LoginPage.jsx";
import RegisterPage from "./pages/auth/RegisterPage.jsx";
import ForgotPasswordPage from "./pages/auth/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/auth/ResetPasswordPage.jsx";
import StaticPage from "./pages/common/StaticPage.jsx";
import UserOverviewPage from "./pages/user/UserOverviewPage.jsx";
import UserServicesPage from "./pages/user/UserServicesPage.jsx";
import UserServiceDetailsPage from "./pages/user/UserServiceDetailsPage.jsx";
import UserBookingPage from "./pages/user/UserBookingPage.jsx";
import UserBookingsPage from "./pages/user/UserBookingsPage.jsx";
import UserProfilePage from "./pages/user/UserProfilePage.jsx";
import WorkerOverviewPage from "./pages/worker/WorkerOverviewPage.jsx";
import WorkerHistoryPage from "./pages/worker/WorkerHistoryPage.jsx";
import WorkerProfilePage from "./pages/worker/WorkerProfilePage.jsx";
import AdminOverviewPage from "./pages/admin/AdminOverviewPage.jsx";
import AdminBookingsPage from "./pages/admin/AdminBookingsPage.jsx";
import AdminServicesPage from "./pages/admin/AdminServicesPage.jsx";
import AdminPeoplePage from "./pages/admin/AdminPeoplePage.jsx";

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
      <Route
        path="/forgot-password"
        element={
          <GuestGate>
            <ForgotPasswordPage />
          </GuestGate>
        }
      />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

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
                subtitle="Discover services, schedule visits, redeem rewards, and follow every booking in real time."
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
  );
}

function RootRedirect() {
  const { user, profile } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardPath(profile?.role)} replace />;
}

function GuestGate({ children }) {
  const { user, profile } = useAuth();

  if (user) {
    return <Navigate to={getDashboardPath(profile?.role)} replace />;
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
