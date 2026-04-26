import { Link } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import { ArrowRight, Clock3, MapPin, Star, TicketPercent } from "lucide-react";
import { formatCurrency } from "../utils/formatters.js";

export default function ServiceCard({ service, detailsLink, ctaLabel = "Explore service" }) {
  return (
    <Motion.div
      whileHover={{ y: -4 }}
      className="group overflow-hidden rounded-[30px] border border-white/10 bg-[#2b1d10]/70 shadow-[0_18px_80px_rgba(30,20,9,0.28)]"
    >
      <div className="relative h-56 overflow-hidden">
        {service.coverImage ? (
          <img
            src={service.coverImage}
            alt={service.name}
            loading="lazy"
            decoding="async"
            className="size-full object-cover transition duration-700 group-hover:scale-105"
          />
        ) : (
          <div className="size-full bg-gradient-to-br from-amber-200/30 via-yellow-200/20 to-white/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
        <div className="absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-slate-950/70 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
          <TicketPercent className="size-3.5 text-amber-200" />
          {service.discountCode}
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-amber-200/80">{service.category}</p>
            <h3 className="mt-2 text-xl font-semibold text-white">{service.name}</h3>
          </div>
          <div className="rounded-2xl bg-white/6 px-3 py-2 text-right">
            <p className="text-xs text-slate-400">Starts from</p>
            <p className="text-lg font-semibold text-white">{formatCurrency(service.price)}</p>
          </div>
        </div>

        <p className="text-sm leading-6 text-slate-400">{service.description}</p>

        <div className="flex flex-wrap gap-2 text-xs text-slate-300">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-3 py-1.5">
            <Star className="size-3.5 text-amber-300" />
            {service.rating} ({service.reviewsCount}+)
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-3 py-1.5">
            <Clock3 className="size-3.5 text-yellow-200" />
            {service.duration}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/6 px-3 py-1.5">
            <MapPin className="size-3.5 text-amber-100" />
            {service.locations?.slice(0, 2).join(", ")}
          </span>
        </div>

        <div className="grid gap-2">
          {service.highlights?.slice(0, 3).map((item) => (
            <div key={item} className="rounded-2xl border border-white/8 bg-white/4 px-3 py-2 text-sm text-slate-300">
              {item}
            </div>
          ))}
        </div>

        <Link
          to={detailsLink}
          className="inline-flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-amber-300 to-yellow-100 px-4 py-3 text-sm font-semibold text-amber-950 transition hover:brightness-110"
        >
          {ctaLabel}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </Motion.div>
  );
}
