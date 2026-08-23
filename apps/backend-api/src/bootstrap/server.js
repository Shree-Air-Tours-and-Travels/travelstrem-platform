import app from "./app.js";
import initializeDatabase from "./database.js";
import config from "../config/index.js";
import logger from "../shared/logger/index.js";
import { verifyEmailConnection } from "../config/mail.js";
import { attachRealtime } from "../realtime/index.js";

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

export async function startServer({
    port = Number(config.PORT || 5000),
    shutdownTimeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS,
} = {}) {
    await initializeDatabase();
    await verifyEmailConnection();

    const server = app.listen(port, () => {
        logger.info(`Server running on port ${port} (env: ${config.NODE_ENV})`);
    });

    // Realtime shares the platform HTTP server: same origin, same auth, no
    // separate websocket service.
    const realtime = attachRealtime(server);

    const shutdown = () => {
        logger.info("Shutting down gracefully...");
        const closeHttp = new Promise((resolve) => server.close(() => resolve()));
        const closeRealtime = realtime?.realtimeClose
            ? realtime
                  .realtimeClose()
                  .catch((err) => logger.error("[Realtime] shutdown error:", err?.message))
            : Promise.resolve();
        Promise.race([
            Promise.all([closeHttp, closeRealtime]),
            new Promise((resolve) => setTimeout(resolve, shutdownTimeoutMs)),
        ]).then(() => process.exit(0));
    };

    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);

    return server;
}

export default startServer;
