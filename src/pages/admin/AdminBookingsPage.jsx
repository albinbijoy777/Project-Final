import { useEffect, useState } from "react";
import {
  approveRescheduleRequest,
  assignWorkerToBooking,
  clearBookingHistoryForRole,
  listAllBookings,
  listProfiles,
  peekAllBookingsCache,
  peekProfilesCache,
  sortWorkersForBooking,
  subscribeToTable,
  updateBookingStatus,
} from "../../services/platformService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { formatCurrency, formatDateTime } from "../../utils/formatters.js";
import {
  BOOKING_FILTERS,
  BOOKING_SORT_OPTIONS,
  matchesBookingDate,
  matchesBookingFilter,
  matchesBookingSearch,
  sortBookings,
} from "../../utils/bookingFilters.js";
import { Search, Trash2 } from "lucide-react";
import { canWorkerTakeAssignments } from "../../utils/profile.js";

const STATUS_OPTIONS = ["pending", "assigned", "in_progress", "cancelled"];

export default function AdminBookingsPage() {
  const { profile } = useAuth();
  const { pushToast } = useToast();
  const cachedBookings = peekAllBookingsCache();
  const cachedWorkers = peekProfilesCache("worker");
  const [bookings, setBookings] = useState(cachedBookings || []);
  const [workers, setWorkers] = useState(cachedWorkers || []);
  const [loading, setLoading] = useState(!(cachedBookings !== undefined && cachedWorkers !== undefined));
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [sortBy, setSortBy] = useState("latest");
  const [approvingId, setApprovingId] = useState(null);

  useEffect(() => {
    async function load(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const [bookingsData, workersData] = await Promise.all([
          listAllBookings(),
          listProfiles("worker"),
        ]);
        setBookings(bookingsData);
        setWorkers(workersData);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    load(cachedBookings === undefined || cachedWorkers === undefined);

    const stopBookings = subscribeToTable({
      channelName: "admin-bookings-list",
      table: "bookings",
      onChange: () => load(false),
    });
    const stopProfiles = subscribeToTable({
      channelName: "admin-bookings-workers",
      table: "profiles",
      onChange: () => load(false),
    });

    return () => {
      stopBookings?.();
      stopProfiles?.();
    };
  }, [cachedBookings, cachedWorkers]);

  async function handleAssign(bookingId, workerId) {
    if (!workerId) return;

    try {
      const updated = await assignWorkerToBooking(bookingId, workerId, profile?.name || "Admin");
      pushToast({
        title: "Worker assigned",
        message: "The booking has been routed successfully.",
        type: "success",
      });
      setBookings((current) =>
        current.map((booking) =>
          booking.id === bookingId
            ? updated
            : booking
        )
      );
    } catch (error) {
      pushToast({
        title: "Assignment failed",
        message: error.message || "Unable to assign the worker.",
        type: "error",
      });
    }
  }

  async function handleStatusChange(bookingId, status) {
    try {
      await updateBookingStatus(bookingId, status, profile?.name || "Admin");
      pushToast({
        title: "Status updated",
        message: `Booking is now ${status.replaceAll("_", " ")}.`,
        type: "success",
      });
      setBookings((current) =>
        current.map((booking) => (booking.id === bookingId ? { ...booking, status } : booking))
      );
    } catch (error) {
      pushToast({
        title: "Status update failed",
        message: error.message || "Unable to update the booking.",
        type: "error",
      });
    }
  }

  async function handleApproveReschedule(booking) {
    setApprovingId(booking.id);

    try {
      const updated = await approveRescheduleRequest(booking.id, profile?.name || "Admin");
      setBookings((current) => current.map((item) => (item.id === booking.id ? updated : item)));
      pushToast({
        title: "Reschedule approved",
        message: "The booking slot has been updated and everyone has been notified.",
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Approval failed",
        message: error.message || "Unable to approve the reschedule request.",
        type: "error",
      });
    } finally {
      setApprovingId(null);
    }
  }

  async function handleClearHistory() {
    if (!filteredBookings.length) return;

    const confirmed = window.confirm(`Clear ${filteredBookings.length} booking record(s) from the admin view?`);
    if (!confirmed) return;

    try {
      const clearedCount = await clearBookingHistoryForRole({
        role: "admin",
        bookingIds: filteredBookings.map((booking) => booking.id),
      });

      const hiddenIds = new Set(filteredBookings.map((booking) => booking.id));
      setBookings((current) => current.filter((booking) => !hiddenIds.has(booking.id)));
      pushToast({
        title: "History cleaned",
        message: `${clearedCount || filteredBookings.length} booking record(s) were removed from the admin view.`,
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Clear failed",
        message: error.message || "Unable to clean the admin booking history right now.",
        type: "error",
      });
    }
  }

  const filteredBookings = sortBookings(
    bookings.filter(
      (booking) =>
        matchesBookingFilter(booking, filter) &&
        matchesBookingSearch(booking, search) &&
        matchesBookingDate(booking, dateFilter)
    ),
    sortBy
  );

  if (loading) {
    return <LoadingPanel rows={5} />;
  }

  const availableWorkers = workers.filter((worker) => canWorkerTakeAssignments(worker));

  return (
    <div className="space-y-4">
      <div className="panel rounded-[30px] p-5">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Booking controls</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Filter and clean booking history</h2>
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

        <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_220px]">
          <div className="flex items-center gap-3 rounded-[24px] border border-white/8 bg-white/4 px-4 py-3">
            <Search className="size-4 text-slate-500" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              placeholder="Search by service, address, requirement, or status"
            />
          </div>

          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="input-shell w-full rounded-[24px] px-4 py-3"
          />
        </div>

        <div className="mt-3 lg:max-w-[220px]">
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value)}
            className="input-shell w-full rounded-[24px] px-4 py-3"
          >
            {BOOKING_SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                Sort: {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredBookings.map((booking) => (
        <div key={booking.id} className="panel rounded-[30px] p-6">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="max-w-3xl">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-semibold text-white">{booking.serviceName}</h3>
                <StatusBadge status={booking.status} />
              </div>
              <p className="mt-3 text-sm text-slate-400">{formatDateTime(booking.service_date, booking.service_time)}</p>
              <p className="mt-3 text-sm leading-6 text-slate-500">{booking.address}</p>
              {booking.serviceState || booking.serviceDistrict ? (
                <p className="mt-2 text-sm text-slate-300">
                  Service area: {[booking.serviceDistrict, booking.serviceState].filter(Boolean).join(", ")}
                </p>
              ) : null}
              {booking.requirementDetails ? (
                <p className="mt-4 text-sm leading-6 text-slate-400">{booking.requirementDetails}</p>
              ) : null}
              {booking.hasPendingReschedule ? (
                <div className="mt-4 rounded-[24px] border border-amber-200/20 bg-amber-300/8 p-4">
                  <p className="text-sm font-semibold text-amber-100">Pending reschedule request</p>
                  {booking.rescheduleRequest?.requestedBy === "worker" ? (
                    <>
                      <p className="mt-2 text-sm text-slate-200">
                        {booking.rescheduleRequest?.actorLabel || "The worker"} asked for admin action on this booking.
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Reassign a new worker or cancel the booking if the current worker cannot continue.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="mt-2 text-sm text-slate-200">
                        Requested slot: {booking.rescheduleRequest?.requestedDate} at {booking.rescheduleRequest?.requestedTime}
                      </p>
                      <p className="mt-2 text-sm text-slate-300">
                        Reason: {booking.rescheduleRequest?.reason || "No reason provided"}
                      </p>
                      <button
                        type="button"
                        onClick={() => handleApproveReschedule(booking)}
                        disabled={approvingId === booking.id}
                        className="mt-4 rounded-2xl bg-gradient-to-r from-amber-300 to-orange-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {approvingId === booking.id ? "Applying..." : "Approve requested slot"}
                      </button>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            <div className="grid min-w-[280px] gap-3">
              <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Booking amount</p>
                <p className="mt-2 text-2xl font-semibold text-white">{formatCurrency(booking.price)}</p>
              </div>

              <select
                value={booking.technician_id || ""}
                onChange={(event) => handleAssign(booking.id, event.target.value)}
                className="input-shell w-full rounded-2xl px-4 py-3.5"
              >
                <option value="">Assign worker</option>
                {(availableWorkers.length ? sortWorkersForBooking(availableWorkers, booking) : sortWorkersForBooking(workers, booking)).map((worker) => (
                  <option key={worker.id} value={worker.id}>
                    {worker.name}
                    {worker.coverage_summary && worker.coverage_summary !== "Coverage not configured"
                      ? ` - ${worker.coverage_summary}`
                      : ""}
                  </option>
                ))}
              </select>

              {booking.status === "completed" ? (
                <div className="rounded-[24px] border border-emerald-200/20 bg-emerald-400/8 px-4 py-3 text-sm font-medium text-emerald-100">
                  Completed by worker
                </div>
              ) : (
                <select
                  value={booking.status}
                  onChange={(event) => handleStatusChange(booking.id, event.target.value)}
                  className="input-shell w-full rounded-2xl px-4 py-3.5"
                >
                  {STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </option>
                  ))}
                </select>
              )}
            </div>
          </div>
        </div>
      ))}

      {!filteredBookings.length ? (
        <div className="panel rounded-[30px] p-8 text-sm text-slate-400">
          No admin booking records match this filter right now.
        </div>
      ) : null}
    </div>
  );
}
