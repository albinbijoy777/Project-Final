import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Activity, CalendarRange, Coins, Sparkles } from "lucide-react";
import { listServices, listUserBookings, subscribeToTable } from "../../services/platformService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import SectionHeading from "../../components/SectionHeading.jsx";
import StatCard from "../../components/StatCard.jsx";
import ServiceCard from "../../components/ServiceCard.jsx";
import StatusBadge from "../../components/StatusBadge.jsx";
import { formatCompactNumber, formatCurrency, formatDateTime } from "../../utils/formatters.js";

export default function UserOverviewPage() {
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return undefined;

    async function load(showLoader = false) {
      if (showLoader) {
        setLoading(true);
      }

      try {
        const [servicesData, bookingsData] = await Promise.all([
          listServices(),
          listUserBookings(user.id),
        ]);
        setServices(servicesData);
        setBookings(bookingsData);
      } finally {
        if (showLoader) {
          setLoading(false);
        }
      }
    }

    load(true);

    const stopBookings = subscribeToTable({
      channelName: `user-bookings-${user.id}`,
      table: "bookings",
      filter: `user_id=eq.${user.id}`,
      onChange: () => load(false),
    });

    const stopServices = subscribeToTable({
      channelName: "services-live",
      table: "services",
      onChange: () => load(false),
    });

    return () => {
      stopBookings?.();
      stopServices?.();
    };
  }, [user?.id]);

  const upcomingBookings = bookings.filter((booking) => booking.status !== "completed");
  const completedBookings = bookings.filter((booking) => booking.status === "completed");
  const rewardBalance = bookings.reduce(
    (total, booking) => total + (booking.status === "completed" ? booking.rewardCoinsEarned : 0) - booking.rewardCoinsRedeemed,
    0
  );

  if (loading) {
    return (
      <div className="grid gap-6">
        <LoadingPanel rows={3} />
        <LoadingPanel rows={4} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="dashboard-grid">
        <StatCard
          icon={CalendarRange}
          label="Upcoming bookings"
          value={upcomingBookings.length}
          hint="Live assignments and pending visits"
        />
        <StatCard
          icon={Coins}
          label="Reward balance"
          value={formatCompactNumber(Math.max(rewardBalance, 0))}
          hint="Coins earned from completed bookings"
          accent="from-amber-300 to-orange-400"
        />
        <StatCard
          icon={Activity}
          label="Completed jobs"
          value={completedBookings.length}
          hint="Historical service record"
          accent="from-teal-300 to-emerald-400"
        />
        <StatCard
          icon={Sparkles}
          label="Live services"
          value={services.length}
          hint="Currently available in your account"
          accent="from-sky-300 to-cyan-400"
        />
      </div>

      <SectionHeading
        eyebrow="For you"
        title="Featured home services"
        description="Live pricing, rewards, availability, and assignment-ready service categories."
        action={
          <Link
            to="/user/services"
            className="rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10"
          >
            Browse all services
          </Link>
        }
      />

      <div className="grid gap-6 xl:grid-cols-3">
        {services.slice(0, 3).map((service) => (
          <ServiceCard
            key={service.id || service.slug}
            service={service}
            detailsLink={`/user/services/${service.id || service.slug}`}
          />
        ))}
      </div>

      <SectionHeading
        eyebrow="Live tracking"
        title="Recent booking activity"
        description="Every assignment and status change is synced across user, worker, and admin dashboards."
      />

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="panel rounded-[30px] p-6">
          <div className="space-y-4">
            {bookings.length ? (
              bookings.slice(0, 5).map((booking) => (
                <div
                  key={booking.id}
                  className="rounded-[24px] border border-white/8 bg-white/4 p-4"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-base font-semibold text-white">{booking.serviceName}</p>
                      <p className="mt-2 text-sm text-slate-400">
                        {formatDateTime(booking.service_date, booking.service_time)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-500">{booking.address}</p>
                    </div>
                    <div className="flex flex-col items-start gap-3 sm:items-end">
                      <StatusBadge status={booking.status} />
                      <p className="text-sm font-medium text-slate-200">{formatCurrency(booking.price)}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-[24px] border border-dashed border-white/10 bg-white/4 p-8 text-sm text-slate-400">
                No bookings yet. Your first booking will appear here with live updates and notifications.
              </div>
            )}
          </div>
        </div>

        <div className="panel rounded-[30px] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Reward and promo engine</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">Use rewards to reduce checkout costs</h3>
          <p className="mt-3 text-sm leading-7 text-slate-400">
            Completed jobs add reward coins automatically. Promo codes and coins are applied inside booking checkout.
          </p>

          <div className="mt-6 space-y-4">
            {services.slice(0, 3).map((service) => (
              <div key={service.slug} className="rounded-[24px] border border-white/8 bg-white/4 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-white">{service.name}</p>
                    <p className="mt-2 text-sm text-slate-400">Promo: {service.discountCode}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-400/10 px-3 py-2 text-sm font-semibold text-amber-200">
                    +{service.rewardCoins} coins
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
