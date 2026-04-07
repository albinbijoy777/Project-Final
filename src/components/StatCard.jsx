import { motion as Motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, hint, accent = "from-cyan-400 to-teal-400" }) {
  return (
    <Motion.div
      whileHover={{ y: -4, scale: 1.01 }}
      className="panel group rounded-[28px] p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
          <p className="mt-2 text-sm text-slate-400">{hint}</p>
        </div>
        {Icon ? (
          <div className={`rounded-2xl bg-gradient-to-br ${accent} p-3 text-slate-950 shadow-lg shadow-cyan-500/10`}>
            <Icon className="size-5" />
          </div>
        ) : null}
      </div>
    </Motion.div>
  );
}
