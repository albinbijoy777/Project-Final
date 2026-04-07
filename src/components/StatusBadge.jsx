import { sentenceCase } from "../utils/formatters.js";

const STYLES = {
  pending: "bg-amber-400/10 text-amber-200 ring-1 ring-amber-300/20",
  assigned: "bg-sky-400/10 text-sky-200 ring-1 ring-sky-300/20",
  in_progress: "bg-cyan-400/10 text-cyan-200 ring-1 ring-cyan-300/20",
  completed: "bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-300/20",
  cancelled: "bg-rose-400/10 text-rose-200 ring-1 ring-rose-300/20",
};

export default function StatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold ${STYLES[status] || "bg-white/8 text-slate-200 ring-1 ring-white/10"}`}
    >
      {sentenceCase(status || "unknown")}
    </span>
  );
}
