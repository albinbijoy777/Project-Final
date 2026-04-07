import { useEffect, useState } from "react";
import { Activity, IndianRupee, Package2, Users } from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { listAllBookings, listProfiles, listServices, subscribeToTable } from "../../services/platformService.js";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import StatCard from "../../components/StatCard.jsx";
import SectionHeading from "../../components/SectionHeading.jsx";
import { formatCompactNumber, formatCurrency } from "../../utils/formatters.js";

const STATUS_COLORS = ["#38bdf8", "#14b8a6", "#f59e0b", "#fb7185"];

export default function AdminOverviewPage() {
  const [state, setState] = useState({
    bookings: [],
    profiles: [],
    services: [],
    loading: true,
  });

  useEffect(() => {
    async function load(showLoader = false) {
      if (showLoader) {
        setState((current) => ({ ...current, loading: true }));
      }

      try {
        const [bookings, profiles, services] = await Promise.all([
          listAllBookings(),
          listProfiles(),
          listServices({ includeInactive: true }),
        ]);
        setState({ bookings, profiles, services, loading: false });
      } catch (_error) {
        if (showLoader) {
          setState((current) => ({ ...current, loading: false }));
        }
      }
    }

    load(true);

    const stopBookings = subscribeToTable({
      channelName: "admin-overview-bookings",
      table: "bookings",
      onChange: () => load(false),
    });
    const stopProfiles = subscribeToTable({
      channelName: "admin-overview-profiles",
      table: "profiles",
      onChange: () => load(false),
    });
    const stopServices = subscribeToTable({
      channelName: "admin-overview-services",
      table: "services",
      onChange: () => load(false),
    });

    return () => {
      stopBookings?.();
      stopProfiles?.();
      stopServices?.();
    };
  }, []);

  if (state.loading) {
    return <LoadingPanel rows={5} />;
  }

  const totalRevenue = state.bookings
    .filter((booking) => booking.status === "completed")
    .reduce((sum, booking) => sum + Number(booking.price || 0), 0);
  const activeUsers = state.profiles.filter((profile) => profile.role === "user").length;
  const workers = state.profiles.filter((profile) => profile.role === "worker").length;
  const activeServices = state.services.filter((service) => service.active !== false).length;

  const statusData = ["pending", "assigned", "in_progress", "completed"].map((status) => ({
    name: status.replaceAll("_", " "),
    value: state.bookings.filter((booking) => booking.status === status).length,
  }));

  const servicePerformance = state.services.slice(0, 6).map((service) => ({
    name: service.name,
    bookings: state.bookings.filter((booking) => booking.serviceName === service.name).length,
  }));

  const workerPerformance = state.profiles
    .filter((profile) => profile.role === "worker")
    .map((profile) => ({
      name: profile.name,
      completed: state.bookings.filter(
        (booking) => booking.technician_id === profile.id && booking.status === "completed"
      ).length,
    }))
    .sort((first, second) => second.completed - first.completed)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      <div className="dashboard-grid">
        <StatCard
          icon={IndianRupee}
          label="Revenue closed"
          value={formatCurrency(totalRevenue)}
          hint="Completed booking value"
          accent="from-amber-300 to-orange-400"
        />
        <StatCard
          icon={Users}
          label="Active users"
          value={formatCompactNumber(activeUsers)}
          hint={`${workers} active workers in dispatch`}
          accent="from-sky-300 to-cyan-400"
        />
        <StatCard
          icon={Package2}
          label="Service catalog"
          value={activeServices}
          hint="Live services visible to customers"
          accent="from-teal-300 to-emerald-400"
        />
        <StatCard
          icon={Activity}
          label="Total bookings"
          value={state.bookings.length}
          hint="All requests and service history"
          accent="from-rose-300 to-orange-300"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className="panel rounded-[32px] p-6">
          <SectionHeading
            eyebrow="Bookings"
            title="Status distribution"
            description="A quick view of workload mix across the platform."
          />
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={70} outerRadius={100} paddingAngle={4}>
                  {statusData.map((entry, index) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="panel rounded-[32px] p-6">
          <SectionHeading
            eyebrow="Demand"
            title="Top service demand"
            description="Which services are producing the most booking activity."
          />
          <div className="mt-6 h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={servicePerformance}>
                <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#94a3b8", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="bookings" radius={[12, 12, 0, 0]} fill="#38bdf8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[32px] p-6">
          <SectionHeading
            eyebrow="Operations"
            title="Recent booking events"
            description="Latest bookings across users, workers, and admins."
          />
          <div className="mt-6 space-y-4">
            {state.bookings.slice(0, 6).map((booking) => (
              <div key={booking.id} className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-white">{booking.serviceName}</p>
                    <p className="mt-2 text-sm text-slate-400">{booking.address}</p>
                  </div>
                  <span className="rounded-full bg-white/8 px-3 py-1 text-xs text-slate-300">
                    {booking.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-[32px] p-6">
          <SectionHeading
            eyebrow="Workforce"
            title="Top worker output"
            description="Completed jobs by worker account."
          />
          <div className="mt-6 space-y-4">
            {workerPerformance.map((worker) => (
              <div key={worker.name} className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-white">{worker.name}</p>
                  <span className="rounded-full bg-teal-400/10 px-3 py-1 text-xs font-medium text-teal-200">
                    {worker.completed} completed
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
