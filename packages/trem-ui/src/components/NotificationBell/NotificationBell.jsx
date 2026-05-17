import React, { useEffect, useRef, useState } from "react";
import Icon from "../../icons/Icon/Icon.jsx";
import "./NotificationBell.styles.scss";

export default function NotificationBell({ fetcher, markAllReadPath = "/notifications/read-all", listPath = "/notifications?limit=8" }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);
  const lastLoadedAt = useRef(0);

  async function loadNotifications() {
    const now = Date.now();
    if (!fetcher || loading || now - lastLoadedAt.current < 30000) return;
    setLoading(true);
    try {
      const res = await fetcher(listPath);
      if (res?.status === "success") {
        setItems(res.componentData?.data || []);
        setUnreadCount(Number(res.componentData?.config?.unreadCount || 0));
        lastLoadedAt.current = now;
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (open) loadNotifications();
  }, [open]);

  useEffect(() => {
    function onClick(event) {
      if (!panelRef.current || panelRef.current.contains(event.target)) return;
      setOpen(false);
    }
    if (open) window.addEventListener("mousedown", onClick);
    return () => window.removeEventListener("mousedown", onClick);
  }, [open]);

  async function markAllRead() {
    if (!fetcher) return;
    const res = await fetcher(markAllReadPath, { method: "POST", headers: { "Content-Type": "application/json" } });
    if (res?.status === "success") {
      setItems(res.componentData?.data || []);
      setUnreadCount(Number(res.componentData?.config?.unreadCount || 0));
    }
  }

  return (
    <div className="trem-header-notification" ref={panelRef}>
      <button className="trem-header-notification__button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Notifications">
        <Icon name="bell" size={19} />
        {unreadCount > 0 ? <strong>{unreadCount > 9 ? "9+" : unreadCount}</strong> : null}
      </button>
      {open ? (
        <div className="trem-header-notification__panel">
          <header>
            <span>Notifications</span>
            {unreadCount > 0 ? <button type="button" onClick={markAllRead}>Mark all read</button> : null}
          </header>
          {loading ? <p>Loading...</p> : null}
          {!loading && !items.length ? <p>No notifications yet.</p> : null}
          <div className="trem-header-notification__list">
            {items.map((item) => (
              <article key={item.id || item._id} className={item.isRead ? "" : "is-unread"}>
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </article>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
