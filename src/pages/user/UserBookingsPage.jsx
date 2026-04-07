import { useEffect, useState } from "react";
import { Download, Printer, Trash2 } from "lucide-react";
import { clearBookingHistoryForRole, listUserBookings, subscribeToTable } from "../../services/platformService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { downloadCsv } from "../../utils/exporters.js";
import { formatCurrency, formatDateTime, sentenceCase } from "../../utils/formatters.js";
import { BOOKING_FILTERS, getStatusesForBookingFilter, matchesBookingFilter } from "../../utils/bookingFilters.js";

export default function UserBookingsPage() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user?.id) return undefined;

    async function load(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const data = await listUserBookings(user.id);
        setBookings(data);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    load(true);

    return subscribeToTable({
      channelName: `user-bookings-page-${user.id}`,
      table: "bookings",
      filter: `user_id=eq.${user.id}`,
      onChange: () => load(false),
    });
  }, [user?.id]);

  function exportBookings() {
    downloadCsv(
      "user-bookings.csv",
      bookings.map((booking) => ({
        service: booking.serviceName,
        date: booking.service_date,
        time: booking.service_time,
        status: booking.status,
        price: booking.price,
        address: booking.address,
        payment_method: booking.paymentMethod,
      }))
    );
  }

  function printInvoice(booking) {
    const popup = window.open("", "_blank", "width=960,height=720");
    if (!popup) return;

    popup.document.write(`
      <html>
        <head>
          <title>Invoice - ${booking.serviceName}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 32px; color: #0f172a; }
            h1 { margin-bottom: 8px; }
            .card { border: 1px solid #cbd5e1; border-radius: 16px; padding: 20px; margin-top: 16px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; }
          </style>
        </head>
        <body>
          <h1>FixBee Invoice</h1>
          <p>${booking.serviceName}</p>
          <div class="card">
            <div class="row"><span>Status</span><strong>${sentenceCase(booking.status)}</strong></div>
            <div class="row"><span>Schedule</span><strong>${formatDateTime(booking.service_date, booking.service_time)}</strong></div>
            <div class="row"><span>Address</span><strong>${booking.address || "-"}</strong></div>
            <div class="row"><span>Payment</span><strong>${sentenceCase(booking.paymentMethod)}</strong></div>
            <div class="row"><span>Amount</span><strong>${formatCurrency(booking.price)}</strong></div>
          </div>
        </body>
      </html>
    `);
    popup.document.close();
    popup.focus();
    popup.print();
  }

  async function handleClearHistory() {
    if (!filteredBookings.length) return;

    const confirmed = window.confirm(`Clear ${filteredBookings.length} booking record(s) from your history view?`);
    if (!confirmed) return;

    try {
      const clearedCount = await clearBookingHistoryForRole({
        role: "user",
        statuses: getStatusesForBookingFilter(filter),
      });

      setBookings((current) => current.filter((booking) => !matchesBookingFilter(booking, filter)));
      pushToast({
        title: "History cleaned",
        message: `${clearedCount || filteredBookings.length} booking record(s) were removed from your view.`,
        type: "success",
      });
    } catch (error) {
      pushToast({
        title: "Clear failed",
        message: error.message || "Unable to clean your booking history right now.",
        type: "error",
      });
    }
  }

  const filteredBookings = bookings.filter((booking) => matchesBookingFilter(booking, filter));

  if (loading) {
    return <LoadingPanel rows={4} />;
  }

  return (
    <div className="space-y-6">
      <div className="panel rounded-[30px] p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Booking history</p>
            <h2 className="mt-2 text-2xl font-semibold text-white">Track every visit and invoice</h2>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleClearHistory}
              disabled={!filteredBookings.length}
              className="inline-flex items-center gap-2 rounded-2xl border border-rose-200/15 bg-rose-400/8 px-4 py-3 text-sm font-medium text-rose-100 transition hover:bg-rose-400/12 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Trash2 className="size-4" />
              Clear filtered
            </button>
            <button
              type="button"
              onClick={exportBookings}
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

      <div className="space-y-4">
        {filteredBookings.map((booking) => (
          <div key={booking.id} className="panel rounded-[30px] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="max-w-3xl">
                <div className="flex flex-wrap items-center gap-3">
                  <h3 className="text-xl font-semibold text-white">{booking.serviceName}</h3>
                  <StatusBadge status={booking.status} />
                </div>
                <p className="mt-3 text-sm text-slate-400">
                  {formatDateTime(booking.service_date, booking.service_time)}
                </p>
                <p className="mt-3 text-sm leading-6 text-slate-500">{booking.address}</p>
                {booking.requirementDetails ? (
                  <p className="mt-4 text-sm leading-6 text-slate-400">{booking.requirementDetails}</p>
                ) : null}

                <div className="mt-5 flex flex-wrap gap-2">
                  {(booking.timeline || []).slice().reverse().slice(0, 3).map((item) => (
                    <div key={item.id} className="rounded-2xl border border-white/8 bg-white/4 px-3 py-2 text-xs text-slate-300">
                      {item.title}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex min-w-[220px] flex-col gap-3">
                <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Amount</p>
                  <p className="mt-3 text-2xl font-semibold text-white">{formatCurrency(booking.price)}</p>
                </div>
                <button
                  type="button"
                  onClick={() => printInvoice(booking)}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
                >
                  <Printer className="size-4" />
                  Print / Save PDF
                </button>
              </div>
            </div>
          </div>
        ))}

        {!filteredBookings.length ? (
          <div className="panel rounded-[30px] p-8 text-sm text-slate-400">
            No booking records match this filter right now.
          </div>
        ) : null}
      </div>
    </div>
  );
}
