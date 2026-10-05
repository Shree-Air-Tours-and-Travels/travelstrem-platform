import { runWithCapturedTenantIntegrationContext } from "../modules/integrations/runtime.js";
import app from "./app.js";
import initializeDatabase from "./database.js";
import config from "../config/index.js";
import logger from "../shared/logger/index.js";
import { verifyEmailConnection } from "../config/mail.js";
import { attachRealtime } from "../realtime/index.js";
import { disconnectRedis, initializeRedis } from "../shared/redis/client.js";

const DEFAULT_SHUTDOWN_TIMEOUT_MS = 10_000;

export async function startServer({
    port = Number(config.PORT || 5000),
    shutdownTimeoutMs = DEFAULT_SHUTDOWN_TIMEOUT_MS,
} = {}) {
    const { createServer } = await import("node:http");
    let ready = false;
    const server = createServer((req, res) => {
        if (!ready) {
            res.writeHead(503, { "Content-Type": "application/json", "Retry-After": "5" });
            res.end(
                JSON.stringify({
                    status: "error",
                    message: "Service is starting. Please try again shortly.",
                }),
            );
            return;
        }
        app(req, res);
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(port, "0.0.0.0", resolve);
    });
    logger.info(`HTTP port ${port} bound; initializing services (env: ${config.NODE_ENV})`);

    try {
        logger.info("Initializing database...");
        await initializeDatabase();
        logger.info("Initializing Redis...");
        await initializeRedis();
    } catch (error) {
        server.close();
        throw error;
    }

    // Realtime shares the platform HTTP server: same origin, same auth, no
    // separate websocket service.
    const realtime = await attachRealtime(server);
    ready = true;
    logger.info(`Server ready on port ${port}`);
    // SMTP verification must not delay HTTP readiness.
    void runWithCapturedTenantIntegrationContext(
        { tenantId: process.env.TENANT_CLIENT_ID || "travelstrem" },
        verifyEmailConnection,
    ).catch((error) => logger.error("Email startup verification failed:", error?.message));

    let isShuttingDown = false;
    const shutdown = async () => {
        if (isShuttingDown) return;
        isShuttingDown = true;
        logger.info("Shutting down gracefully...");
        const closeHttp = new Promise((resolve) => server.close(() => resolve()));
        const closeRealtime = realtime?.realtimeClose
            ? realtime
                  .realtimeClose()
                  .catch((err) => logger.error("[Realtime] shutdown error:", err?.message))
            : Promise.resolve();
        await Promise.race([
            Promise.all([closeHttp, closeRealtime]),
            new Promise((resolve) => setTimeout(resolve, shutdownTimeoutMs)),
        ]);
        await disconnectRedis();
        process.exit(0);
    };

    process.once("SIGTERM", shutdown);
    process.once("SIGINT", shutdown);

    return server;
}

export default startServer;
