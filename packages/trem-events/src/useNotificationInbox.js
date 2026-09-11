import { useCallback, useEffect, useRef, useState } from "react";
import { REALTIME_EVENTS } from "./realtime/realtime-types.js";
import useRealtimeEvent from "./realtime/useRealtimeEvent.js";

const normalizeNotification = (item = {}) => {
  const id = item._id || item.notificationId || item.id;
  return id ? { ...item, _id: id, notificationId: item.notificationId || id } : null;
};

const sortByCreatedAt = (items = []) =>
  [...items].sort((left, right) => new Date(right.createdAt || 0) - new Date(left.createdAt || 0));

const currentPortalScope = () => {
  if (typeof window === "undefined") return "customer";
  const explicit = String(window.__TREM_AUTH_PORTAL__ || "").trim().toLowerCase();
  if (["admin", "partner", "customer"].includes(explicit)) return explicit;
  const prefix = String(window.__TREM_AUTH_STORAGE_PREFIX__ || "").toLowerCase();
  if (prefix.includes("admin")) return "admin";
  if (prefix.includes("agent") || prefix.includes("partner")) return "partner";
  return "customer";
};

export default function useNotificationInbox({ loadInbox, readInboxItem, readAllInboxItems }) {
  const [state, setState] = useState({ items: [], unread: 0, loading: true, error: null });
  const callbacksRef = useRef({ loadInbox, readInboxItem, readAllInboxItems });

  useEffect(() => {
    callbacksRef.current = { loadInbox, readInboxItem, readAllInboxItems };
  }, [loadInbox, readAllInboxItems, readInboxItem]);

  const load = useCallback(async (params) => {
    const data = await callbacksRef.current.loadInbox?.(params);
    const items = (data?.items || []).map(normalizeNotification).filter(Boolean);
    setState({ items: sortByCreatedAt(items), unread: data?.unread || 0, loading: false, error: null });
  }, []);
  useEffect(() => { load().catch((error) => setState((current) => ({ ...current, loading: false, error }))); }, [load]);
  useRealtimeEvent(REALTIME_EVENTS.NOTIFICATION_CREATED, (envelope) => {
    const item = normalizeNotification(envelope?.data || envelope);
    if (!item?._id) return;
    if (item.portal && item.portal !== currentPortalScope()) return;
    setState((current) => ({
      ...current,
      items: sortByCreatedAt([
        { ...item, readAt: item.readAt || null },
        ...current.items.filter((entry) => String(entry._id) !== String(item._id)),
      ]).slice(0, 6),
      unread: current.items.some((entry) => String(entry._id) === String(item._id) && !entry.readAt)
        ? current.unread
        : current.unread + (item.readAt ? 0 : 1),
    }));
  });
  const markRead = useCallback(async (id) => {
    if (!id) return;
    await callbacksRef.current.readInboxItem?.(id);
    setState((current) => ({ ...current, unread: Math.max(0, current.unread - (current.items.find((item) => String(item._id) === String(id))?.readAt ? 0 : 1)), items: current.items.map((item) => String(item._id) === String(id) ? { ...item, readAt: new Date().toISOString() } : item) }));
  }, []);
  const markAllRead = useCallback(async () => {
    await callbacksRef.current.readAllInboxItems?.();
    setState((current) => ({ ...current, unread: 0, items: current.items.map((item) => ({ ...item, readAt: item.readAt || new Date().toISOString() })) }));
  }, []);
  return { ...state, load, markRead, markAllRead };
}
