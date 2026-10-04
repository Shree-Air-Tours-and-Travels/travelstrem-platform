/**
 * Per-instance connection bookkeeping. With the Redis adapter enabled this
 * stays per-instance by design: it only powers logging/metrics, never
 * authorization. Room membership is owned by Socket.IO + Redis.
 */
const socketsByUser = new Map();

export function trackConnection(context, socketId) {
    const set = socketsByUser.get(context.userId) || new Set();
    set.add(socketId);
    socketsByUser.set(context.userId, set);
}

export function untrackConnection(context, socketId) {
    const set = socketsByUser.get(context.userId);
    if (!set) return;
    set.delete(socketId);
    if (set.size === 0) socketsByUser.delete(context.userId);
}

export function getUserConnectionCount(userId) {
    return socketsByUser.get(String(userId))?.size || 0;
}

export function getConnectedUserIds() {
    return [...socketsByUser.keys()];
}

export function resetConnectionTracking() {
    socketsByUser.clear();
}
