import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";
import { Bell, X, Clock, ExternalLink } from "lucide-react";

// How often to poll for new notifications while the tab is open.
const NOTIFICATION_POLL_MS = 30000;

function timeAgo(iso) {
  if (!iso) return "";
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function formatFullDateTime(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export default function NotificationBell() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const notifRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target))
        setNotifOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close modal on Escape key press
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === "Escape") {
        setSelectedNotification(null);
      }
    }
    if (selectedNotification) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [selectedNotification]);

  // Poll for payment-reminder notifications (e.g. "last payment day" balance
  // due) while logged in, so the bell badge stays live without a refresh.
  useEffect(() => {
    let cancelled = false;
    function refresh() {
      getUnreadCount()
        .then((c) => {
          if (!cancelled) setUnreadCount(c);
        })
        .catch(() => {});
    }
    refresh();
    const interval = setInterval(refresh, NOTIFICATION_POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  function toggleNotifDropdown() {
    const opening = !notifOpen;
    setNotifOpen(opening);
    if (opening) {
      getMyNotifications()
        .then(setNotifications)
        .catch(() => {});
    }
  }

  function handleNotificationClick(n) {
    if (!n.read) {
      markNotificationRead(n.id)
        .then(() => {
          setUnreadCount((c) => Math.max(0, c - 1));
          setNotifications((list) =>
            list.map((x) => (x.id === n.id ? { ...x, read: true } : x)),
          );
        })
        .catch(() => {});
    }
    setNotifOpen(false);
    setSelectedNotification(n);
  }

  function handleMarkAllRead() {
    markAllNotificationsRead()
      .then(() => {
        setUnreadCount(0);
        setNotifications((list) => list.map((x) => ({ ...x, read: true })));
      })
      .catch(() => {});
  }

  return (
    <div className="relative" ref={notifRef}>
      <button
        className="relative flex items-center justify-center rounded-full p-1 text-gray-600 hover:bg-gray-100 hover:text-[#2D6A4F]"
        onClick={toggleNotifDropdown}
        aria-label="Notifications"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          width="20"
          height="20"
        >
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full border-[1.5px] border-white bg-red-600 text-3xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {notifOpen && (
        <div className="absolute right-0 top-[calc(100%+10px)] z-[1001] w-80 max-w-[90vw] origin-top-right overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg animate-fade-in-up">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <p className="text-sm font-bold text-gray-900">Notifications</p>
            {notifications.some((n) => !n.read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs font-semibold text-[#2D6A4F] hover:underline"
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-8 text-center text-sm text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.map((n) => (
                <button
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50 cursor-pointer ${!n.read ? "bg-green-50/50" : ""}`}
                >
                  <div className="flex w-full items-center gap-2">
                    {!n.read && (
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#2D6A4F]" />
                    )}
                    <span className="text-sm font-semibold text-gray-900">
                      {n.title}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {n.message}
                  </p>
                  <span className="text-3xs text-gray-400">
                    {timeAgo(n.createdAt)}
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}

      {/* ── Full Notification Detail Modal ── */}
      {selectedNotification && (
        <div
          className="fixed inset-0 z-[2500] flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notification-modal-title"
        >
          {/* Backdrop (closes on click) */}
          <div
            className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
            onClick={() => setSelectedNotification(null)}
          />

          {/* Modal Container */}
          <div
            className="relative w-full max-w-lg rounded-3xl bg-white p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in fade-in zoom-in-95 duration-150 text-slate-900"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button (X) */}
            <button
              type="button"
              onClick={() => setSelectedNotification(null)}
              aria-label="Close modal"
              className="absolute top-5 right-5 p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all cursor-pointer"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-start gap-3.5 mb-4 pr-6">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 shadow-2xs">
                <Bell size={20} />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className="text-3xs font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-900">
                    {selectedNotification.bookingType
                      ? `${selectedNotification.bookingType} UPDATE`
                      : "NOTIFICATION"}
                  </span>
                  {selectedNotification.createdAt && (
                    <span className="text-3xs font-semibold text-slate-400 flex items-center gap-1">
                      <Clock size={11} className="text-slate-400" />
                      {timeAgo(selectedNotification.createdAt)}
                      {formatFullDateTime(selectedNotification.createdAt)
                        ? ` • ${formatFullDateTime(selectedNotification.createdAt)}`
                        : ""}
                    </span>
                  )}
                </div>
                <h3
                  id="notification-modal-title"
                  className="text-base sm:text-lg font-black text-slate-900 leading-snug"
                >
                  {selectedNotification.title}
                </h3>
              </div>
            </div>

            {/* Body: Full untruncated message */}
            <div className="bg-slate-50/90 border border-slate-100 rounded-2xl p-4 sm:p-5 mb-5 text-slate-700 text-xs sm:text-sm leading-relaxed whitespace-pre-wrap select-text">
              {selectedNotification.message}
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedNotification(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all cursor-pointer"
              >
                Close
              </button>
              {(selectedNotification.bookingId ||
                selectedNotification.bookingType ||
                selectedNotification.type === "BALANCE_REMINDER") && (
                <button
                  type="button"
                  onClick={() => {
                    setSelectedNotification(null);
                    navigate("/profile?tab=bookings");
                  }}
                  className="px-4 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-extrabold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <ExternalLink size={14} />
                  View in Bookings
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
