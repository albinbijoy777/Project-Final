import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowRight, CreditCard, MapPin, TicketPercent } from "lucide-react";
import { createBooking, getServiceById, peekServiceCache } from "../../services/platformService.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { useToast } from "../../context/ToastContext.jsx";
import LoadingPanel from "../../components/LoadingPanel.jsx";
import SectionHeading from "../../components/SectionHeading.jsx";
import { formatCurrency } from "../../utils/formatters.js";
import { DEFAULT_SERVICE_DISTRICT, DEFAULT_SERVICE_STATE, getDistrictsForState } from "../../data/indiaLocations.js";
import { extractGooglePlaceSelection, normalizeLocationSelection } from "../../utils/location.js";
import GoogleMapsLocationInput from "../../components/GoogleMapsLocationInput.jsx";

const TIME_SLOTS = [
  "08:00 AM",
  "10:00 AM",
  "12:30 PM",
  "03:00 PM",
  "05:30 PM",
  "07:30 PM",
];

function normalizeCoupon(value) {
  return String(value || "").trim().toUpperCase();
}

export default function UserBookingPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { pushToast } = useToast();
  const cachedService = peekServiceCache(serviceId);
  const initialLocation = normalizeLocationSelection({
    locationText: profile?.address || "",
    state: DEFAULT_SERVICE_STATE,
    district: DEFAULT_SERVICE_DISTRICT,
  });
  const [service, setService] = useState(cachedService || null);
  const [loading, setLoading] = useState(!cachedService);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    date: "",
    time: TIME_SLOTS[0],
    location: profile?.address || "",
    state: initialLocation.state,
    district: initialLocation.district,
    placeId: "",
    latitude: "",
    longitude: "",
    phone: profile?.phone || "",
    urgency: "standard",
    paymentMethod: "cash",
    promoCode: "",
    requirementDetails: "",
  });

  useEffect(() => {
    let active = true;

    async function load() {
      if (!cachedService) {
        setLoading(true);
      }

      try {
        const serviceData = await getServiceById(serviceId);
        if (active) {
          setService(serviceData);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      active = false;
    };
  }, [cachedService, serviceId]);

  useEffect(() => {
    setForm((current) => ({
      ...current,
      location: current.location || profile?.address || "",
      state: current.state || initialLocation.state,
      district: current.district || initialLocation.district,
      phone: current.phone || profile?.phone || "",
    }));
  }, [initialLocation.district, initialLocation.state, profile?.address, profile?.phone]);

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  function handleStateChange(event) {
    const nextState = event.target.value;
    const nextDistrict = getDistrictsForState(nextState)[0] || "";
    setForm((current) => ({
      ...current,
      state: nextState,
      district: nextDistrict,
    }));
  }

  function handlePlaceSelect(place) {
    const nextSelection = extractGooglePlaceSelection(place);
    setForm((current) => ({
      ...current,
      state: nextSelection.state || current.state,
      district: nextSelection.district || current.district,
      location: nextSelection.locationText,
      placeId: nextSelection.placeId,
      latitude: nextSelection.latitude,
      longitude: nextSelection.longitude,
    }));
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
        form,
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

  const enteredCoupon = normalizeCoupon(form.promoCode);
  const expectedCoupon = normalizeCoupon(service.discountCode);
  const couponApplied = Boolean(enteredCoupon && expectedCoupon && enteredCoupon === expectedCoupon);
  const showCouponWarning = Boolean(enteredCoupon) && !couponApplied;
  const discountValue = couponApplied ? Math.round(Number(service.price || 0) * 0.1) : 0;
  const finalPrice = Math.max(Number(service.price) - discountValue, 0);
  const minDate = new Date().toISOString().split("T")[0];

  return (
    <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
      <section className="panel rounded-[32px] p-6 sm:p-8">
        <SectionHeading
          eyebrow="Booking checkout"
          title={`Schedule ${service.name}`}
          description="Add service requirements, choose a slot, and apply your coupon before confirming."
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
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm text-slate-300">State</label>
                <select
                  name="state"
                  value={form.state}
                  onChange={handleStateChange}
                  className="input-shell w-full rounded-2xl px-4 py-3.5"
                >
                  <option value="Kerala">Kerala</option>
                  <option value="Karnataka">Karnataka</option>
                </select>
              </div>
              <div>
                <label className="mb-2 block text-sm text-slate-300">District</label>
                <select
                  name="district"
                  value={form.district}
                  onChange={handleChange}
                  className="input-shell w-full rounded-2xl px-4 py-3.5"
                >
                  {getDistrictsForState(form.state).map((district) => (
                    <option key={district} value={district}>
                      {district}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="sm:col-span-2">
            <GoogleMapsLocationInput
              value={form.location}
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  location: value,
                }))
              }
              onPlaceSelect={handlePlaceSelect}
              required
              placeholder="Enter the apartment, street, or landmark"
            />
          </div>
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
          <div className="sm:col-span-2">
            <Field
              label="Coupon code"
              name="promoCode"
              value={form.promoCode}
              onChange={handleChange}
              placeholder={service.discountCode}
            />
            {showCouponWarning ? (
              <div className="mt-2 rounded-2xl border border-rose-200/15 bg-rose-400/8 px-4 py-3 text-sm text-rose-100">
                This coupon does not match the service offer code.
              </div>
            ) : null}
          </div>
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
            <SummaryRow label="Coupon discount" value={`- ${formatCurrency(discountValue)}`} />
            <SummaryRow label="Final estimate" value={formatCurrency(finalPrice)} strong />
          </div>
        </div>

        <div className="panel rounded-[32px] p-6">
          <div className="space-y-4">
            <InfoBlock icon={MapPin} title="Live assignment" text="Admin can match this booking to workers using your selected state, district, and exact location." />
            <InfoBlock icon={CreditCard} title="Flexible payment" text="Keep checkout simple with online or cash-on-service payment methods." />
            <InfoBlock
              icon={TicketPercent}
              title="Coupon offer"
              text={couponApplied ? `${expectedCoupon} is applied to this booking.` : `Use ${service.discountCode} to unlock the service discount.`}
            />
          </div>
        </div>
      </aside>
    </div>
  );
}

function Field({ label, name, type = "text", value, onChange, placeholder, min }) {
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
        required={type !== "text" || name !== "promoCode"}
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
