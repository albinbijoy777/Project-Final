import { motion as Motion } from "framer-motion";

export default function AppBoot() {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-6">
      <div className="absolute inset-0 grid-lines opacity-40" />
      <Motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="panel relative w-full max-w-xl rounded-[32px] p-8 text-center"
      >
        <div className="mx-auto flex size-[4.5rem] items-center justify-center rounded-[26px] bg-gradient-to-br from-amber-200 via-yellow-100 to-amber-300 text-3xl font-bold text-amber-950 shadow-[0_0_80px_rgba(244,197,66,0.18)]">
          <img src="/icons/bee-mark.svg" alt="FixBee bee" className="size-12" />
        </div>
        <h1 className="mt-6 text-3xl font-semibold text-white">FixBee</h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-400">
          Loading your account, live services, and booking updates.
        </p>
        <div className="mt-8 overflow-hidden rounded-full bg-white/6">
          <Motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 1.6, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
            className="h-2 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
          />
        </div>
      </Motion.div>
    </div>
  );
}
