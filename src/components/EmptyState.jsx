import { motion as Motion } from "framer-motion";

export default function EmptyState({ title, description, action }) {
  return (
    <Motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="panel rounded-[28px] p-8 text-center"
    >
      <div className="mx-auto size-16 rounded-full bg-cyan-400/10" />
      <h3 className="mt-5 text-xl font-semibold text-white">{title}</h3>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </Motion.div>
  );
}
