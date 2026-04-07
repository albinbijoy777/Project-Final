import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, Coins, CreditCard, MapPin } from "lucide-react";
import { createBooking, getServiceById, listUserBookings } from "../../services/platformService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import SectionHeading from "../../components/SectionHeading.jsx";
import { formatCurrency } from "../../utils/formatters.js";

const TIME_SLOTS = [
  "08:00 AM",
  "10:00 AM",
  "12:30 PM",
  "03:00 PM",
  "05:30 PM",
  "07:30 PM",
];

export default function UserBookingPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { pushToast } = useToast();
  const [service, setService] = useState(null);
  const [rewardBalance, setRewardBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: TIME_SLOTS[0],
    location: profile?.address || "",
    city: "Bengaluru",
    phone: profile?.phone || "",
    urgency: "standard",
    paymentMethod: "cash",
    promoCode: "",
    rewardCoinsRedeemed: 0,
    requirementDetails: "",
  });

  useEffect(() => {
    if (!user?.id) return;

    async function load() {
      setLoading(true);
      try {
        const [serviceData, bookingsData] = await Promise.all([
          getServiceById(serviceId),
          listUserBookings(user.id),
        ]);
        setService(serviceData);
        const balance = bookingsData.reduce(
          (total, booking) =>
            total + (booking.status === "completed" ? booking.rewardCoinsEarned : 0) - booking.rewardCoinsRedeemed,
          0
        );
        setRewardBalance(Math.max(balance, 0));
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [serviceId, user?.id]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      location: current.location || profile?.address || "",
      phone: current.phone || profile?.phone || "",
    }));
  }, [profile?.address, profile?.phone]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!service || !user?.id) return;

    setSubmitting(true);
    try {
      await createBooking({
        userId: user.id,
        service,
        profile,
        form: {
          ...form,
          rewardCoinsRedeemed: Number(form.rewardCoinsRedeemed || 0),
        },
      });

      pushToast({
        title: "Booking created",
        message: `${service.name} has been added to your live bookings.`,
        type: "success",
      });
      navigate("/user/bookings");
    } catch (error) {
      pushToast({
        title: "Booking failed",
        message: error.message || "Unable to create the booking right now.",
        type: "error",
      });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading || !service) {
    return <LoadingPanel rows={4} />;
  }

  const rewardRedeemed = Math.min(Number(form.rewardCoinsRedeemed || 0), rewardBalance);
  const discountValue = form.promoCode ? Math.round(service.price * 0.1) : 0;
  const finalPrice = Math.max(Number(service.price) - discountValue - rewardRedeemed, 0);
  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="panel rounded-[32px] p-6 sm:p-8">
        <SectionHeading
          eyebrow="Booking checkout"
          title={`Schedule ${service.name}`}
          description="Add service requirements, choose a slot, and confirm payment preferences."
        />

        <form className="mt-8 grid gap-4 sm:grid-cols-2" onSubmit={handleSubmit}>
          <Field label="Preferred date" name="date" type="date" min={minDate} value={form.date} onChange={handleChange} />
          <div>
            <label className="mb-2 block text-sm text-slate-300">Preferred time</label>
            <select
              name="time"
              value={form.time}
              onChange={handleChange}
              className="input-shell w-full rounded-2xl px-4 py-3.5"
            >
              {TIME_SLOTS.map((slot) => (
                <option key={slot} value={slot}>
                  {slot}
                </option>
              ))}
            </select>
          </div>
          <Field label="Phone number" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 9XXXXXXXXX" />
          <div>
            <label className="mb-2 block text-sm text-slate-300">Urgency</label>
            <select
              name="urgency"
              value={form.urgency}
              onChange={handleChange}
              className="input-shell w-full rounded-2xl px-4 py-3.5"
            >
              <option value="standard">Standard</option>
              <option value="priority">Priority</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Service location</label>
            <input
              name="location"
              value={form.location}
              onChange={handleChange}
              className="input-shell w-full rounded-2xl px-4 py-3.5"
              placeholder="Apartment, street, landmark"
              required
            />
          </div>
          <Field label="City" name="city" value={form.city} onChange={handleChange} placeholder="City" />
          <div>
            <label className="mb-2 block text-sm text-slate-300">Payment method</label>
            <select
              name="paymentMethod"
              value={form.paymentMethod}
              onChange={handleChange}
              className="input-shell w-full rounded-2xl px-4 py-3.5"
            >
              <option value="cash">Cash on completion</option>
              <option value="online">Online payment</option>
            </select>
          </div>
          <Field label="Promo code" name="promoCode" value={form.promoCode} onChange={handleChange} placeholder={service.discountCode} />
          <Field
            label={`Coins to redeem (max ${rewardBalance})`}
            name="rewardCoinsRedeemed"
            type="number"
            value={form.rewardCoinsRedeemed}
            onChange={handleChange}
            min="0"
            max={rewardBalance}
          />
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm text-slate-300">Service requirements</label>
            <textarea
              name="requirementDetails"
              value={form.requirementDetails}
              onChange={handleChange}
              rows="5"
              className="input-shell w-full rounded-2xl px-4 py-3.5"
              placeholder="Describe the issue, room size, urgency, access instructions, or anything the worker should know."
            />
          </div>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-100 px-4 py-3.5 text-sm font-semibold text-amber-950 transition hover:brightness-110 disabled:opacity-70"
            >
              {submitting ? "Confirming booking..." : "Confirm booking"}
              <ArrowRight className="size-4" />
            </button>
          </div>
        </form>
      </section>

      <aside className="space-y-6">
        <div className="panel rounded-[32px] p-6">
          <p className="text-sm uppercase tracking-[0.24em] text-slate-500">Order summary</p>
          <h3 className="mt-3 text-2xl font-semibold text-white">{service.name}</h3>
          <div className="mt-6 space-y-3 text-sm text-slate-300">
            <SummaryRow label="Base price" value={formatCurrency(service.price)} />
            <SummaryRow label="Promo discount" value={`- ${formatCurrency(discountValue)}`} />
            <SummaryRow label="Coins redeemed" value={`- ${formatCurrency(rewardRedeemed)}`} />
            <SummaryRow label="Final estimate" value={formatCurrency(finalPrice)} strong />
          </div>
        </div>

        <div className="panel rounded-[32px] p-6">
          <div className="space-y-4">
            <InfoBlock icon={MapPin} title="Live assignment" text="Admin and workers will see this request immediately after confirmation." />
            <InfoBlock icon={CreditCard} title="Flexible payment" text="Keep checkout simple with online or cash-on-service payment methods." />
            <InfoBlock icon={Coins} title="Reward wallet" text={`${rewardBalance} coins are currently available in your account.`} />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, placeholder, min, max }) {
  return (
    <div>
      <label className="mb-2 block text-sm text-slate-300">{label}</label>
      <input
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        className="input-shell w-full rounded-2xl px-4 py-3.5"
        placeholder={placeholder}
        min={min}
        max={max}
        required={type !== "number"}
      />
    </div>
  );
}

function SummaryRow({ label, value, strong = false }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-slate-400">{label}</span>
      <span className={strong ? "text-base font-semibold text-white" : "font-medium text-slate-200"}>{value}</span>
    </div>
  );
}

function InfoBlock({ icon: Icon, title, text }) {
  return (
    <div className="rounded-[24px] border border-white/8 bg-white/4 p-4">
      <div className="inline-flex rounded-2xl bg-amber-300/12 p-3 text-amber-100">
        <Icon className="size-5" />
      </div>
      <p className="mt-4 text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{text}</p>
    </div>
  );
}
