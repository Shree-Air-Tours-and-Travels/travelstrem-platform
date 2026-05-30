import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import morgan from "morgan";
import rateLimit from "express-rate-limit";
import path from "path";
import config from "../config/index.js";
import logger from "../shared/logger/index.js";

const allowedOrigins = Array.isArray(config.FRONTENDS) ? config.FRONTENDS : [];

const corsOptions = {
  origin(origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (config.IS_DEVELOPMENT && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return callback(null, true);
    if (/^https?:\/\/.*--.*\.netlify\.app$/.test(origin) || /\.netlify\.app$/.test(origin)) return callback(null, true);
    if (/\.onrender\.com$/.test(origin)) return callback(null, true);
    return callback(new Error(`CORS blocked: ${origin}`));
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "x-ignore-cookie-auth"],
};

export default function registerMiddleware(app) {
  app.set("trust proxy", true);
  app.use(helmet());
  app.use(app.express.json({ limit: "20mb" }));
  app.use(app.express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(morgan(config.DEBUG ? "dev" : "combined"));
  app.use(cors(corsOptions));
  app.options("*", cors(corsOptions));
  app.use("/uploads", app.express.static(path.resolve("uploads")));

  if (config.DEBUG) {
    app.use((req, res, next) => {
      logger.debug(new Date().toISOString(), req.method, req.originalUrl, "Origin:", req.headers.origin || "n/a");
      next();
    });
  }

  if (!config.IS_DEVELOPMENT) {
    app.use(rateLimit({
      windowMs: config.RATE_LIMIT.windowMs,
      max: config.RATE_LIMIT.max,
      skip: (req) => req.method === "OPTIONS",
    }));
  }
}
