import React, { useEffect, useRef, useState } from "react";
import { fetchData } from "@packages/trem-utils";
import { Bell } from "lucide-react";
import "./NotificationBell.styles.scss";

export default function NotificationBell() {
    const [open, setOpen] = useState(false);
    const [items, setItems] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    async function loadNotifications() {
        setLoading(true);
        try {
            const res = await fetchData("/notifications?limit=8");
            if (res?.status === "success") {
                setItems(res.componentData?.data || []);
                setUnreadCount(Number(res.componentData?.config?.unreadCount || 0));
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        loadNotifications();
        const interval = window.setInterval(loadNotifications, 60000);
        return () => window.clearInterval(interval);
    }, []);

    useEffect(() => {
        function onClick(event) {
            if (!panelRef.current || panelRef.current.contains(event.target)) return;
            setOpen(false);
        }
        if (open) window.addEventListener("mousedown", onClick);
        return () => window.removeEventListener("mousedown", onClick);
    }, [open]);

    async function markAllRead() {
        const res = await fetchData("/notifications/read-all", { method: "POST", headers: { "Content-Type": "application/json" } });
        if (res?.status === "success") {
            setItems(res.componentData?.data || []);
            setUnreadCount(Number(res.componentData?.config?.unreadCount || 0));
        }
    }

    return (
        <div className="notification-bell" ref={panelRef}>
            <button className="notification-bell__button" type="button" onClick={() => setOpen((value) => !value)} aria-label="Notifications">
                <Bell size={18} strokeWidth={2.2} aria-hidden="true" />
                {unreadCount > 0 ? <strong>{unreadCount > 9 ? "9+" : unreadCount}</strong> : null}
            </button>
            {open ? (
                <div className="notification-bell__panel">
                    <header>
                        <span>Notifications</span>
                        {unreadCount > 0 ? <button type="button" onClick={markAllRead}>Mark all read</button> : null}
                    </header>
                    {loading ? <p>Loading...</p> : null}
                    {!loading && !items.length ? <p>No notifications yet.</p> : null}
                    <div className="notification-bell__list">
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
