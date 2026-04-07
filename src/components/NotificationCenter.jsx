import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, CheckCheck, Trash2 } from "lucide-react";
import { AnimatePresence, motion as Motion } from "framer-motion";
import {
  clearNotifications,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToTable,
} from "../services/platformService.js";
import { formatDateTime } from "../utils/formatters.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useToast } from "../context/ToastContext.jsx";

export default function NotificationCenter() {
  const { user } = useAuth();
  const { pushToast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [panelStyle, setPanelStyle] = useState({});
  const buttonRef = useRef(null);
  const panelRef = useRef(null);
  const canUsePortal = typeof document !== "undefined";

  useEffect(() => {
    if (!user?.id) return undefined;

    async function load() {
      const data = await listNotifications(user.id);
      setNotifications(data);
    }

    load();

    return subscribeToTable({
      channelName: `notifications-${user.id}`,
      table: "notifications",
      filter: `user_id=eq.${user.id}`,
      onChange: async (payload) => {
        await load();
        if (payload.eventType === "INSERT" && payload.new?.title) {
          pushToast({
            title: payload.new.title,
            message: payload.new.message || "A new live update is available.",
            type: payload.new.type === "error" ? "error" : "info",
          });
        }
      },
    });
  }, [pushToast, user?.id]);

  const unreadCount = notifications.filter((item) => !item.is_read).length;

  useEffect(() => {
    if (!open) return undefined;

    function updatePosition() {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) return;

      const panelWidth = Math.min(window.innerWidth - 24, 384);
      const left = Math.min(
        Math.max(rect.right - panelWidth, 12),
        Math.max(12, window.innerWidth - panelWidth - 12)
      );
      const top = Math.max(rect.bottom + 12, 86);
      const maxHeight = Math.max(window.innerHeight - top - 18, 220);

      setPanelStyle({
        left,
        top,
        maxHeight,
      });
    }

    function handlePointerDown(event) {
      if (panelRef.current?.contains(event.target) || buttonRef.current?.contains(event.target)) {
        return;
      }

      setOpen(false);
    }

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    updatePosition();
    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open]);

  async function handleRead(notificationId) {
    await markNotificationRead(notificationId);
    setNotifications((current) =>
      current.map((item) => (item.id === notificationId ? { ...item, is_read: true } : item))
    );
  }

  async function handleReadAll() {
    if (!user?.id || !unreadCount) return;

    const success = await markAllNotificationsRead(user.id);
    if (!success) {
      pushToast({
        title: "Action failed",
        message: "Unable to mark all notifications as read right now.",
        type: "error",
      });
      return;
    }

    setNotifications((current) => current.map((item) => ({ ...item, is_read: true })));
  }

  async function handleClearAll() {
    if (!user?.id || !notifications.length) return;

    const confirmed = window.confirm("Clear all notifications from this account?");
    if (!confirmed) return;

    const success = await clearNotifications(user.id);
    if (!success) {
      pushToast({
        title: "Action failed",
        message: "Run the latest notification patch in Supabase if clear is still blocked.",
        type: "error",
      });
      return;
    }

    setNotifications([]);
    pushToast({
      title: "Notifications cleared",
      message: "Your notification list has been cleaned.",
      type: "success",
    });
  }

  return (
    <div className="relative z-[100]">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="relative rounded-2xl border border-white/10 bg-white/6 p-3 text-slate-200 transition hover:border-amber-200/40 hover:bg-white/10"
      >
        <Bell className="size-5" />
        {unreadCount ? (
          <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-amber-300 text-[10px] font-bold text-amber-950">
            {unreadCount}
          </span>
        ) : null}
      </button>

      {canUsePortal
        ? createPortal(
            <AnimatePresence>
              {open ? (
                <>
                  <button
                    type="button"
                    aria-label="Close notifications"
                    onClick={() => setOpen(false)}
                    className="fixed inset-0 z-[9998] bg-transparent"
                  />
                  <Motion.div
                    ref={panelRef}
                    initial={{ opacity: 0, y: 12, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 8, scale: 0.98 }}
                    className="fixed z-[9999] w-[min(92vw,24rem)] rounded-[28px] border border-amber-100/15 bg-[#24180d]/98 p-4 shadow-[0_30px_90px_rgba(20,12,4,0.62)] backdrop-blur-xl"
                    style={{ left: panelStyle.left, top: panelStyle.top }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-white">Live notifications</p>
                        <p className="text-xs text-slate-500">Booking, assignment, and workflow events</p>
                      </div>
                      <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-slate-300">
                        {notifications.length}
                      </span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={handleReadAll}
                        disabled={!unreadCount}
                        className="rounded-full border border-white/10 bg-white/6 px-3 py-2 text-xs font-medium text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark all read
                      </button>
                      <button
                        type="button"
                        onClick={handleClearAll}
                        disabled={!notifications.length}
                        className="inline-flex items-center gap-2 rounded-full border border-rose-200/15 bg-rose-400/8 px-3 py-2 text-xs font-medium text-rose-100 transition hover:bg-rose-400/12 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <Trash2 className="size-3.5" />
                        Clear all
                      </button>
                    </div>

                    <div className="mt-4 space-y-3 overflow-y-auto pr-1" style={{ maxHeight: panelStyle.maxHeight }}>
                      {notifications.length ? (
                        notifications.map((notification) => (
                          <div
                            key={notification.id}
                            className={`rounded-2xl border p-4 ${
                              notification.is_read
                                ? "border-white/8 bg-white/4"
                                : "border-amber-200/20 bg-amber-300/10"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div>
                                <p className="text-sm font-medium text-white">{notification.title}</p>
                                <p className="mt-2 text-sm leading-6 text-slate-300">{notification.message}</p>
                                <p className="mt-3 text-xs text-slate-500">
                                  {formatDateTime(notification.created_at, "")}
                                </p>
                              </div>
                              {!notification.is_read ? (
                                <button
                                  type="button"
                                  onClick={() => handleRead(notification.id)}
                                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/6 hover:text-white"
                                >
                                  <CheckCheck className="size-4" />
                                </button>
                              ) : null}
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="rounded-2xl border border-dashed border-white/10 bg-white/4 p-6 text-sm text-slate-400">
                          No notifications yet. New assignments and booking changes will show up here.
                        </div>
                      )}
                    </div>
                  </Motion.div>
                </>
              ) : null}
            </AnimatePresence>,
            document.body
          )
        : null}
    </div>
  );
}
