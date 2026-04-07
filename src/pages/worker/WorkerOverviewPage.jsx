import { useEffect, useState } from "react";
import { CheckCircle2, ClipboardList, PlayCircle, TimerReset, Trash2 } from "lucide-react";
import {
  clearBookingHistoryForRole,
  listWorkerBookings,
  subscribeToTable,
  updateBookingStatus,
} from "../../services/platformService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import StatCard from "../../components/StatCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { formatDateTime } from "../../utils/formatters.js";
import { BOOKING_FILTERS, getStatusesForBookingFilter, matchesBookingFilter } from "../../utils/bookingFilters.js";

const NEXT_ACTIONS = {
  pending: "in_progress",
  assigned: "in_progress",
  in_progress: "completed",
};

export default function WorkerOverviewPage() {
  const { user, profile } = useAuth();
  const { pushToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [filter, setFilter] = useState("booked");

  useEffect(() => {
    if (!user?.id) return undefined;

    async function load(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await listWorkerBookings(user.id);
        setBookings(data);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    load(true);

    return subscribeToTable({
      channelName: `worker-bookings-${user.id}`,
      table: "bookings",
      filter: `technician_id=eq.${user.id}`,
      onChange: () => load(false),
    });
  }, [user?.id]);

  async function handleStatusChange(booking, nextStatus) {
    setUpdatingId(booking.id);
    try {
      await updateBookingStatus(booking.id, nextStatus, profile?.name || "Worker");
      pushToast({
        title: "Job updated",
        message: `${booking.serviceName} is now marked ${nextStatus.replaceAll("_", " ")}.`,
        type: "success",
      });
      setBookings((current) =>
        current.map((item) => (item.id === booking.id ? { ...item, status: nextStatus } : item))
      );
    } catch (error) {
      pushToast({
        title: "Update failed",
        message: error.message || "Unable to change job status.",
        type: "error",
      });
    } finally {
      setUpdatingId(null);
    }
  }

  async function handleClearHistory() {
    if (!filteredBookings.length) return;

    const confirmed = window.confirm(`Clear ${filteredBookings.length} assignment record(s) from your worker view?`);
    if (!confirmed) return;

    try {
      const clearedCount = await clearBookingHistoryForRole({
        role: "worker",
        statuses: getStatusesForBookingFilter(filter),
      });

      setBookings((current) => current.filter((booking) => !matchesBookingFilter(booking, filter)));
      pushToast({
        title: "History cleaned",
        message: `${clearedCount || filteredBookings.length} worker record(s) were removed from your view.`,
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Clear failed",
        message: error.message || "Unable to clean the worker history right now.",
        type: "error",
      });
    }
  }

  const activeBookings = bookings.filter((booking) => booking.status !== "completed");
  const completedBookings = bookings.filter((booking) => booking.status === "completed");
  const pendingBookings = bookings.filter((booking) => ["pending", "assigned"].includes(booking.status));
  const filteredBookings = bookings.filter((booking) => matchesBookingFilter(booking, filter));

  if (loading) {
    return <LoadingPanel rows={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-grid">
        <StatCard icon={ClipboardList} label="Assigned jobs" value={bookings.length} hint="All jobs routed to your account" />
        <StatCard
          icon={TimerReset}
          label="Pending response"
          value={pendingBookings.length}
          hint="Needs action from your side"
          accent="from-amber-300 to-orange-400"
        />
        <StatCard
          icon={PlayCircle}
          label="Active execution"
          value={activeBookings.filter((booking) => booking.status === "in_progress").length}
          hint="Jobs currently in progress"
          accent="from-sky-300 to-cyan-400"
        />
        <StatCard
          icon={CheckCircle2}
          label="Completed jobs"
          value={completedBookings.length}
          hint="Delivered and closed service tasks"
          accent="from-teal-300 to-emerald-400"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="panel rounded-[30px] p-5">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Assignment filters</p>
                <h2 className="mt-2 text-2xl font-semibold text-white">Track work by job status</h2>
              </div>
              <button
                type="button"
                onClick={handleClearHistory}
                disabled={!filteredBookings.length}
                className="inline-flex items-center gap-2 rounded-2xl border border-rose-200/15 bg-rose-400/8 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-400/12 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <Trash2 className="size-4" />
                Clear filtered
              </button>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {BOOKING_FILTERS.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setFilter(item.value)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    filter === item.value ? "bg-white text-slate-950" : "bg-white/6 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {filteredBookings.length ? (
            filteredBookings.map((booking) => {
              const nextStatus = NEXT_ACTIONS[booking.status];
              return (
                <div key={booking.id} className="panel rounded-[30px] p-6">
                  <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                    <div className="max-w-3xl">
                      <div className="flex flex-wrap items-center gap-3">
                        <h3 className="text-xl font-semibold text-white">{booking.serviceName}</h3>
                        <StatusBadge status={booking.status} />
                      </div>
                      <p className="mt-3 text-sm text-slate-400">{formatDateTime(booking.service_date, booking.service_time)}</p>
                      <p className="mt-3 text-sm leading-6 text-slate-500">{booking.address}</p>
                      {booking.requirementDetails ? (
                        <p className="mt-4 text-sm leading-6 text-slate-400">{booking.requirementDetails}</p>
                      ) : null}
                    </div>

                    <div className="flex min-w-[220px] flex-col gap-3">
                      {nextStatus ? (
                        <button
                          type="button"
                          onClick={() => handleStatusChange(booking, nextStatus)}
                          disabled={updatingId === booking.id}
                          className="rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:opacity-70"
                        >
                          {updatingId === booking.id
                            ? "Updating..."
                            : nextStatus === "completed"
                              ? "Mark completed"
                              : "Start job"}
                        </button>
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="panel rounded-[30px] p-8 text-sm text-slate-400">
              No assignments match this filter right now. New jobs will appear here in real time when admin routes work to your account.
            </div>
          )}
        </div>

        <div className="panel rounded-[30px] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Worker notes</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">What to focus on during execution</h3>
          <div className="mt-6 space-y-3">
            {[
              "Confirm access details before travel.",
              "Update the status when you start actual work on site.",
              "Use clear completion notes so users and admins have a clean service history.",
            ].map((item) => (
              <div key={item} className="rounded-[22px] border border-white/8 bg-white/4 px-4 py-3 text-sm text-slate-300">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
