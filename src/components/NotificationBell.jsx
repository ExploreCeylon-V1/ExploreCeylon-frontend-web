import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getMyNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
} from "../services/notificationService";

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

export default function NotificationBell() {
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
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
    navigate("/profile?tab=bookings");
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
                  className={`flex w-full flex-col items-start gap-0.5 px-4 py-3 text-left border-b border-gray-50 last:border-0 hover:bg-gray-50 ${!n.read ? "bg-green-50/50" : ""}`}
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
    </div>
  );
}
