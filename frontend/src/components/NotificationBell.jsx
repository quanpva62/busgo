import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext.jsx";
import Icon from "./Icon.jsx";

const API = import.meta.env.VITE_API_URL;

const TYPE_ICON = {
  booking: "confirmation_number",
  payment: "payments",
  trip: "directions_bus",
  report: "flag",
  promo: "sell",
};

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return "Vừa xong";
  if (diff < 3600) return `${Math.floor(diff / 60)} phút trước`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} giờ trước`;
  return `${Math.floor(diff / 86400)} ngày trước`;
}

export default function NotificationBell() {
  const { user, token, authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const panelRef = useRef(null);

  // Load lịch sử noti khi mount / đổi user
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    async function load() {
      try {
        const res = await authFetch(`${API}/api/notifications/my`);
        if (!res.ok || cancelled) return;
        const data = await res.json();
        setItems(data.notifications ?? []);
        setUnread(data.unreadCount ?? 0);
      } catch {
        // ignore
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authFetch]);

  // Subscribe SSE realtime
  useEffect(() => {
    if (!user || !token) return;
    const es = new EventSource(
      `${API}/api/notifications/stream?token=${encodeURIComponent(token)}`,
    );
    es.onmessage = (e) => {
      const noti = JSON.parse(e.data);
      setItems((prev) => [noti, ...prev]);
      setUnread((u) => u + 1);
    };
    return () => es.close();
  }, [user, token]);

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    function onClick(e) {
      if (panelRef.current && !panelRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markRead(id) {
    setItems((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnread((u) => Math.max(0, u - 1));
    try {
      await authFetch(`${API}/api/notifications/${id}/read`, {
        method: "PATCH",
      });
    } catch {
      // ignore
    }
  }

  async function markAllRead() {
    setItems((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    try {
      await authFetch(`${API}/api/notifications/read-all`, { method: "PATCH" });
    } catch {
      // ignore
    }
  }

  if (!user) return null;

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative p-2 hover:bg-slate-50 rounded-xl transition-colors  cursor-pointer"
        aria-label="Thông báo"
      >
        <Icon name="notifications" className="w-6 h-6 text-slate-600 " />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-4 h-4 px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-lg border border-outline-variant overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-outline-variant/10">
            <p className="font-bold text-on-surface">Thông báo</p>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                className="text-xs font-bold text-primary hover:opacity-70 cursor-pointer"
              >
                Đánh dấu đã đọc
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <p className="text-secondary text-sm text-center py-8">
                Chưa có thông báo nào.
              </p>
            ) : (
              items.map((n) => (
                <button
                  key={n.id}
                  onClick={() => !n.isRead && markRead(n.id)}
                  className={`w-full text-left flex gap-3 px-4 py-3 border-b border-outline-variant/10 last:border-b-0 transition-colors cursor-pointer ${
                    n.isRead
                      ? "hover:bg-surface-container-low"
                      : "bg-primary/5 hover:bg-primary/10"
                  }`}
                >
                  <Icon
                    name={TYPE_ICON[n.type] || "notifications"}
                    className="w-5 h-5 text-primary shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-on-surface">
                      {n.title}
                    </p>
                    <p className="text-secondary text-xs mt-0.5 leading-relaxed">
                      {n.body}
                    </p>
                    <p className="text-secondary/60 text-[10px] mt-1">
                      {timeAgo(n.createdAt)}
                    </p>
                  </div>
                  {!n.isRead && (
                    <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  )}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
