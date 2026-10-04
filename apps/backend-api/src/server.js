import startServer from "./bootstrap/server.js";
import logger from "./shared/logger/index.js";

try {
    await startServer();
} catch (err) {
    logger.error("Failed to start server:", err?.stack || err);
    process.exit(1);
}
