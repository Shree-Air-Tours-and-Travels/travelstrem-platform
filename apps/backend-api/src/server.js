import app from "./bootstrap/express.js";
import initializeDatabase from "./bootstrap/database.js";
import config from "./config/index.js";

const port = Number(config.PORT || 5000);

try {
  await initializeDatabase();
  const server = app.listen(port, () => {
    console.log(`Server running on port ${port} (env: ${config.NODE_ENV})`);
  });

  const shutdown = () => {
    console.log("Shutting down gracefully...");
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(1), 10_000).unref();
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
} catch (err) {
  console.error("Failed to start server:", err?.stack || err);
  process.exit(1);
}
