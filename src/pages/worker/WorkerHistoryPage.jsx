import { useEffect, useState } from "react";
import { Download, Trash2 } from "lucide-react";
import { clearBookingHistoryForRole, listWorkerBookings, subscribeToTable } from "../../services/platformService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import { downloadCsv } from "../../utils/exporters.js";
import { formatCurrency, formatDateTime } from "../../utils/formatters.js";
import { BOOKING_FILTERS, getStatusesForBookingFilter, matchesBookingFilter } from "../../utils/bookingFilters.js";

export default function WorkerHistoryPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("completed");

  useEffect(() => {
    if (!user?.id) return undefined;

    async function load(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await listWorkerBookings(user.id);
        setHistory(data);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    load(true);

    return subscribeToTable({
      channelName: `worker-history-${user.id}`,
      table: "bookings",
      filter: `technician_id=eq.${user.id}`,
      onChange: () => load(false),
    });
  }, [user?.id]);

  function exportHistory() {
    downloadCsv(
      "worker-history.csv",
      filteredHistory.map((booking) => ({
        service: booking.serviceName,
        date: booking.service_date,
        time: booking.service_time,
        amount: booking.price,
        address: booking.address,
      }))
    );
  }

  async function handleClearHistory() {
    if (!filteredHistory.length) return;

    const confirmed = window.confirm(`Clear ${filteredHistory.length} worker history record(s) from this page?`);
    if (!confirmed) return;

    try {
      const clearedCount = await clearBookingHistoryForRole({
        role: "worker",
        statuses: getStatusesForBookingFilter(filter),
      });

      setHistory((current) => current.filter((booking) => !matchesBookingFilter(booking, filter)));
      pushToast({
        title: "History cleaned",
        message: `${clearedCount || filteredHistory.length} worker record(s) were removed from your history view.`,
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

  const filteredHistory = history.filter((booking) => matchesBookingFilter(booking, filter));

  if (loading) {
    return <LoadingPanel rows={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="panel rounded-[30px] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Worker history</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Review completed and active job records</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={!filteredHistory.length}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200/15 bg-rose-400/8 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-400/12 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Clear filtered
            </button>
            <button
              type="button"
              onClick={exportHistory}
              className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
            >
              <Download className="size-4" />
              Export CSV
            </button>
          </div>
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

      <div className="grid gap-4">
        {filteredHistory.map((booking) => (
          <div key={booking.id} className="panel rounded-[30px] p-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{booking.serviceName}</p>
                <p className="mt-2 text-sm text-slate-400">{formatDateTime(booking.service_date, booking.service_time)}</p>
                <p className="mt-3 text-sm text-slate-500">{booking.address}</p>
              </div>
              <div className="rounded-[24px] border border-white/8 bg-white/4 px-5 py-4 text-right">
                <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Service amount</p>
                <p className="mt-2 text-xl font-semibold text-white">{formatCurrency(booking.price)}</p>
              </div>
            </div>
          </div>
        ))}

        {!filteredHistory.length ? (
          <div className="panel rounded-[30px] p-8 text-sm text-slate-400">
            No worker history matches this filter right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}
