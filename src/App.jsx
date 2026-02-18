import { Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminPanel from "./pages/AdminPanel";
import TechnicianTasks from "./pages/TechnicianTasks";
import BookService from "./pages/BookService";
import MyBookings from "./pages/MyBookings";
import Profile from "./pages/Profile";
import BookingSuccess from "./pages/BookingSuccess";
import Notifications from "./pages/Notifications";
import Chat from "./pages/Chat";
import ProtectedRoute from "./components/ProtectedRoute";
import RoleRoute from "./components/RoleRoute";

export default function App() {
  return (
    <Routes>
  <Route path="/" element={<Login />} />

  <Route
    path="/dashboard"
    element={
      <RoleRoute allowed={["customer"]}>
        <Dashboard />
      </RoleRoute>
    }
  />

  <Route path="/book" element={<ProtectedRoute><BookService /></ProtectedRoute>} />
  <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
  <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
  <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
  <Route path="/chat/:bookingId" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
  <Route path="/booking-success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />

  <Route
    path="/admin"
    element={
      <RoleRoute allowed={["admin"]}>
        <AdminPanel />
      </RoleRoute>
    }
  />

  <Route
    path="/tasks"
    element={
      <RoleRoute allowed={["technician"]}>
        <TechnicianTasks />
      </RoleRoute>
    }
  />
</Routes>

  );
}
