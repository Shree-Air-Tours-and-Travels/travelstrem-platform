// server.js
/**
 * Main server entry
 * - Uses server/config.js as single source of truth
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import connectDB from "./config/db.js"; // keep your existing DB connector
import config from "./config/index.js"; // <--- import the single config file

// Import your routes (paths left as you had them)
import authRoutes from "./routes/authRoutes.js";
import tourRoutes from "./routes/tourRoutes.js";
import heroRoutes from "./routes/heroRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import formsRouter from "./routes/form.js";
import filtersRoutes from "./routes/filtersRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import bookingRoutes from "./routes/bookingsRoutes.js";

const app = express();
app.set("trust proxy", true);

// middleware
app.use(helmet());
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Logging
if (config.DEBUG) {
    app.use(morgan("dev"));
} else {
    app.use(morgan("combined"));
}

// Rate limiter
const limiter = rateLimit({
    windowMs: config.RATE_LIMIT.windowMs,
    max: config.RATE_LIMIT.max,
});
app.use(limiter);

// Debug friendly request logger (non-secret)
if (config.DEBUG) {
    app.use((req, res, next) => {
        // eslint-disable-next-line no-console
        console.log(new Date().toISOString(), req.method, req.originalUrl, "Origin:", req.headers.origin || "n/a");
        next();
    });
}

/* ------------------------------
   CORS (whitelist)
   ------------------------------ */
const allowedOrigins = Array.isArray(config.FRONTENDS) ? config.FRONTENDS : [];

app.use(
    cors({
        origin: function (origin, callback) {
            // no origin (server-to-server/curl) -> allow
            if (!origin) return callback(null, true);

            // exact match
            if (allowedOrigins.includes(origin)) return callback(null, true);

            // allow netlify preview patterns
            if (/^https?:\/\/.*--.*\.netlify\.app$/.test(origin) || /\.netlify\.app$/.test(origin)) return callback(null, true);

            // allow Render subdomains
            if (/\.onrender\.com$/.test(origin)) return callback(null, true);

            return callback(new Error(`CORS blocked: ${origin}`));
        },
        credentials: true,
        optionsSuccessStatus: 200,
    })
);

// Preflight handler
app.options("*", cors());

/* ------------------------------
   Basic health and root
   ------------------------------ */
app.get("/health", (req, res) => res.status(200).json({ status: "ok", env: config.NODE_ENV }));
app.get("/", (req, res) => res.send(`${config.APP_NAME} API is running`));

/* ------------------------------
   Register routes (keep your existing mounts)
   ------------------------------ */
app.use("/api/auth", authRoutes);
app.use("/api/tours.json", tourRoutes);
app.use("/api/hero.json", heroRoutes);
app.use("/api/services.json", serviceRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api", formsRouter);
app.use("/api", filtersRoutes);
app.use("/api/bookings", bookingRoutes);

/* ------------------------------
   Optional: list registered routes in dev
   ------------------------------ */
function listRoutes(appInstance) {
    console.log("Registered routes:");
    try {
        appInstance._router.stack.forEach((middleware) => {
            if (middleware.route) {
                const methods = Object.keys(middleware.route.methods).join(",").toUpperCase();
                console.log(methods, middleware.route.path);
            } else if (middleware.name === "router" && middleware.handle && Array.isArray(middleware.handle.stack)) {
                middleware.handle.stack.forEach((handler) => {
                    if (!handler.route) return;
                    const methods = Object.keys(handler.route.methods).join(",").toUpperCase();
                    console.log(methods, handler.route.path);
                });
            }
        });
    } catch (err) {
        console.warn("Failed to list routes", err);
    }
}

if (config.DEBUG) {
    listRoutes(app);
}

/* ------------------------------
   Central error handler
   ------------------------------ */
app.use((err, req, res, next) => {
    if (err && err.message && err.message.startsWith("CORS blocked:")) {
        return res.status(403).json({ status: "error", message: err.message });
    }
    console.error(err && err.stack ? err.stack : err);
    return res.status(err.status || 500).json({ status: "error", message: err.message || "Internal Server Error" });
});

/* ------------------------------
   Start server after DB connect
   ------------------------------ */
const START_PORT = Number(process.env.PORT || config.PORT || 5000);

(async () => {
    try {
        await connectDB(); // keep your DB connector (ensure it reads config.MONGO_URI)
        config.logConfigSummary?.();

        const server = app.listen(START_PORT, () => {
            // eslint-disable-next-line no-console
            console.log(`🚀 Server running on port ${START_PORT} (env: ${config.NODE_ENV})`);
        });

        // Graceful shutdown
        const shutdown = async () => {
            // eslint-disable-next-line no-console
            console.log("Shutting down gracefully...");
            server.close(() => {
                // eslint-disable-next-line no-console
                console.log("HTTP server closed");
                process.exit(0);
            });
            setTimeout(() => process.exit(1), 10_000).unref();
        };

        process.on("SIGTERM", shutdown);
        process.on("SIGINT", shutdown);
    } catch (err) {
        // eslint-disable-next-line no-console
        console.error("Failed to start server:", err && err.stack ? err.stack : err);
        process.exit(1);
    }
})();
