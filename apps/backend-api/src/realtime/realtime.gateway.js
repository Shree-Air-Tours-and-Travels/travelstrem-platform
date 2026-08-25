import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import Redis from "ioredis";
import config from "../config/index.js";
import logger from "../shared/logger/index.js";
import realtimeConfig, { isRealtimeOriginAllowed } from "./realtime.config.js";
import authenticateHandshake from "./realtime.auth.js";
import { validateSubscriptionPayload } from "./realtime.validation.js";
import authorizeSubscription from "./realtime.subscriptions.js";
import consumeSubscriptionRateLimit from "./realtime.rate-limit.js";
import { trackConnection, untrackConnection } from "./realtime.connection-manager.js";
import { setRealtimeServer } from "./realtime.publisher.js";
import {
    REALTIME_COMMANDS,
    REALTIME_ERROR_CODES,
    REALTIME_EVENTS,
    realtimeError,
    room,
} from "./realtime.constants.js";

const SUBSCRIBE_COMMANDS = new Set([
    REALTIME_COMMANDS.SUBSCRIBE_BOOKING,
    REALTIME_COMMANDS.SUBSCRIBE_TOUR,
    REALTIME_COMMANDS.SUBSCRIBE_TRIP,
    REALTIME_COMMANDS.SUBSCRIBE_SUPPORT,
]);

const UNSUBSCRIBE_COMMANDS = new Map([
    [REALTIME_COMMANDS.UNSUBSCRIBE_BOOKING, "booking"],
    [REALTIME_COMMANDS.UNSUBSCRIBE_TOUR, "tour"],
    [REALTIME_COMMANDS.UNSUBSCRIBE_TRIP, "trip"],
    [REALTIME_COMMANDS.UNSUBSCRIBE_SUPPORT, "support"],
]);

const resourceRoom = (resource, id) =>
    ({ booking: room.booking, tour: room.tour, trip: room.trip, support: room.support })[resource](
        id,
    );

/**
 * Joins the automatic system rooms implied by the verified identity. Every
 * socket also joins the shared catalog room so platform-wide catalog events
 * (e.g. tour:published) reach all connected clients without subscriptions.
 */
function joinIdentityRooms(socket, context) {
    socket.join(room.user(context.userId));
    if (context.agencyId) socket.join(room.agency(context.agencyId));
    if (context.role === "admin" || context.adminLevel !== "none") socket.join(room.admin());
    socket.join(room.catalog());
}

async function handleSubscribeCommand(io, socket, context, payload) {
    const validated = validateSubscriptionPayload(payload);
    if (!validated.ok) return validated;

    const limit = await consumeSubscriptionRateLimit(context);
    if (!limit.allowed) {
        return {
            ok: false,
            error: realtimeError(REALTIME_ERROR_CODES.RATE_LIMITED, limit.message),
            retryAfterMs: limit.retryAfterMs,
        };
    }

    const membershipCount = [...socket.rooms].filter((r) => r !== socket.id).length;
    if (membershipCount >= realtimeConfig.maxSubscriptionsPerSocket) {
        return {
            ok: false,
            error: realtimeError(
                REALTIME_ERROR_CODES.RATE_LIMITED,
                "Too many active subscriptions on this connection.",
            ),
        };
    }

    const decision = await authorizeSubscription(context, validated.resource, validated.id);
    if (!decision.ok) return decision;

    const roomName = resourceRoom(validated.resource, validated.id);
    socket.join(roomName);
    logger.debug(`[Realtime] subscription authorized user=${context.userId} room=${roomName}`);
    return { ok: true, room: roomName };
}

function registerConnectionHandlers(io) {
    io.on("connection", async (socket) => {
        const context = socket.data.context;
        trackConnection(context, socket.id);
        logger.info(
            `[Realtime] connection accepted user=${context.userId} portal=${context.portal} socket=${socket.id}`,
        );

        joinIdentityRooms(socket, context);
        socket.emit(REALTIME_EVENTS.SYSTEM_CONNECTED, {
            eventId: `${socket.id}`,
            event: REALTIME_EVENTS.SYSTEM_CONNECTED,
            timestamp: new Date().toISOString(),
            version: 1,
            data: { userId: context.userId, role: context.role, portal: context.portal },
        });

        for (const command of SUBSCRIBE_COMMANDS) {
            socket.on(command, async (payload, callback) => {
                try {
                    const result = await handleSubscribeCommand(io, socket, context, payload);
                    if (typeof callback === "function") {
                        callback(
                            result.ok ? { ok: true } : { ok: false, error: result.error || result },
                        );
                    }
                    if (!result.ok && !result.error?.code?.startsWith("REALTIME")) {
                        logger.warn(
                            `[Realtime] command failure user=${context.userId} cmd=${command}`,
                        );
                    }
                } catch (err) {
                    logger.error(
                        `[Realtime] subscribe handler error user=${context.userId}:`,
                        err?.stack || err,
                    );
                    if (typeof callback === "function") {
                        callback({
                            ok: false,
                            error: realtimeError(
                                REALTIME_ERROR_CODES.INTERNAL_ERROR,
                                "Unable to process subscription.",
                            ),
                        });
                    }
                }
            });
        }

        for (const [command, resource] of UNSUBSCRIBE_COMMANDS) {
            socket.on(command, (payload, callback) => {
                const validated = validateSubscriptionPayload(payload);
                if (!validated.ok || validated.resource !== resource) {
                    if (typeof callback === "function") {
                        callback({
                            ok: false,
                            error: validated.code
                                ? validated
                                : realtimeError(
                                      REALTIME_ERROR_CODES.INVALID_PAYLOAD,
                                      "Malformed unsubscribe payload.",
                                  ),
                        });
                    }
                    return;
                }
                socket.leave(resourceRoom(resource, validated.id));
                if (typeof callback === "function") callback({ ok: true });
            });
        }

        socket.on("disconnect", (reason) => {
            untrackConnection(context, socket.id);
            logger.info(
                `[Realtime] socket disconnected user=${context.userId} socket=${socket.id} reason=${reason}`,
            );
        });

        socket.on("error", (err) => {
            logger.error(
                `[Realtime] socket error user=${context.userId} socket=${socket.id}:`,
                err?.message || err,
            );
        });
    });

    io.engine.on("connection_error", (err) => {
        // Handshake failures (bad auth / blocked origin). Log code only — never
        // tokens or headers.
        logger.warn(`[Realtime] connection rejected code=${err.code} message=${err.message}`);
    });
}

/**
 * Attaches the Socket.IO server to the existing TravelsTREM HTTP server.
 * Returns the io instance, or null when realtime is disabled/unavailable.
 */
const createAdapterRedisClient = (label) => {
    const client = new Redis(config.REDIS_URL, {
        lazyConnect: true,
        connectTimeout: 10000,
        maxRetriesPerRequest: null,
        enableReadyCheck: true,
        keepAlive: 10000,
        retryStrategy: (attempt) => Math.min(attempt * 200, 5000),
    });

    client.on("error", (err) =>
        logger.error(`[Realtime] Redis ${label} client error: ${err.message}`),
    );
    client.on("close", () => logger.warn(`[Realtime] Redis ${label} client connection closed`));
    client.on("reconnecting", (delay) =>
        logger.warn(`[Realtime] Redis ${label} client reconnecting in ${delay}ms`),
    );
    client.on("end", () => logger.warn(`[Realtime] Redis ${label} client connection ended`));

    return client;
};

const closeAdapterRedisClient = async (client) => {
    if (!client || client.status === "end") return;
    try {
        await client.quit();
    } catch (err) {
        logger.warn(`[Realtime] Redis adapter client shutdown failed: ${err.message}`);
        client.disconnect();
    }
};

export async function attachRealtime(httpServer) {
    if (!realtimeConfig.enabled) {
        logger.info("[Realtime] disabled by configuration");
        return null;
    }
    if (!httpServer) throw new Error("attachRealtime requires the HTTP server instance");

    const io = new SocketIOServer(httpServer, {
        path: realtimeConfig.path,
        cors: {
            origin: (origin, callback) => {
                if (isRealtimeOriginAllowed(origin)) return callback(null, true);
                return callback(new Error(`Realtime CORS blocked: ${origin}`));
            },
            credentials: true,
            methods: ["GET", "POST"],
        },
        pingInterval: realtimeConfig.pingIntervalMs,
        pingTimeout: realtimeConfig.pingTimeoutMs,
        maxHttpBufferSize: realtimeConfig.maxHttpBufferSize,
    });

    // Handshake authentication. Sockets without a valid session never reach the
    // connection handler.
    io.use(async (socket, next) => {
        try {
            const result = await authenticateHandshake(socket.handshake);
            if (!result.ok) {
                logger.warn(`[Realtime] handshake rejected: ${result.message}`);
                return next(new Error(result.message));
            }
            socket.data.context = result.context;
            return next();
        } catch (err) {
            logger.error("[Realtime] handshake authentication error:", err?.stack || err);
            return next(new Error("Authentication failed."));
        }
    });

    // Horizontal scaling is opt-in. Single-instance deployments use Socket.IO's
    // default in-memory adapter even though auth/session Redis remains required.
    let pubClient = null;
    let subClient = null;
    if (config.ENABLE_REDIS_SOCKET_ADAPTER) {
        try {
            pubClient = createAdapterRedisClient("publisher");
            subClient = createAdapterRedisClient("subscriber");
            await Promise.all([pubClient.connect(), subClient.connect()]);
            await Promise.all([pubClient.ping(), subClient.ping()]);
            io.adapter(createAdapter(pubClient, subClient));
            logger.info("[Realtime] Redis adapter enabled (multi-instance ready)");
        } catch (err) {
            logger.error(
                `[Realtime] failed to enable Redis adapter (${err?.message}) — continuing single-instance`,
            );
            pubClient?.disconnect();
            subClient?.disconnect();
            pubClient = null;
            subClient = null;
        }
    } else {
        logger.info("[Realtime] Redis adapter disabled — running single-instance");
    }

    registerConnectionHandlers(io);
    setRealtimeServer(io);

    io.httpServer = httpServer;
    io.realtimeClose = async () => {
        io.disconnectSockets(true);
        await io.close();
        await Promise.all([
            closeAdapterRedisClient(pubClient),
            closeAdapterRedisClient(subClient),
        ]);
    };

    logger.info(`[Realtime] gateway attached at path ${realtimeConfig.path}`);
    return io;
}

export default attachRealtime;
