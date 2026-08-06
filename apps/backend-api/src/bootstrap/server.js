import app from "./app.js";
import initializeDatabase from "./database.js";
import config from "../config/index.js";
import logger from "../shared/logger/index.js";
import { verifyEmailConnection } from "../config/mail.js";

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

  const shutdown = () => {
    logger.info("Shutting down gracefully...");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), shutdownTimeoutMs).unref();
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);

  return server;
}

export default startServer;
