import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import { CheckCircle2, CircleAlert, Info, X } from "lucide-react";

const ToastContext = createContext(null);

const ICONS = {
  success: CheckCircle2,
  error: CircleAlert,
  info: Info,
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const pushToast = useCallback((toast) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { id, type: "info", ...toast }]);
    return id;
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  useEffect(() => {
    if (!toasts.length) return undefined;

    const timers = toasts.map((toast) =>
      window.setTimeout(() => {
        removeToast(toast.id);
      }, toast.duration ?? 4200)
    );

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [removeToast, toasts]);

  const value = useMemo(
    () => ({
      pushToast,
      removeToast,
    }),
    [pushToast, removeToast]
  );

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="pointer-events-none fixed right-4 top-4 z-[100] flex w-full max-w-sm flex-col gap-3">
        <AnimatePresence>
          {toasts.map((toast) => {
            const Icon = ICONS[toast.type] || Info;
            return (
              <Motion.div
                key={toast.id}
                initial={{ opacity: 0, y: -16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                className="pointer-events-auto panel overflow-hidden rounded-2xl"
              >
                <div className="flex items-start gap-3 p-4">
                  <div className="rounded-2xl bg-cyan-500/12 p-2 text-cyan-300">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-100">{toast.title}</p>
                    <p className="mt-1 text-sm text-slate-400">{toast.message}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeToast(toast.id)}
                    className="rounded-full p-1 text-slate-400 transition hover:bg-white/5 hover:text-white"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </Motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
