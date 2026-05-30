import logger from "../logger/index.js";
import { normalizeError } from "../errors/index.js";

export default function errorHandler(err, req, res, next) {
  if (err?.message?.startsWith("CORS blocked:")) {
    return res.status(403).json({ status: "error", message: err.message });
  }

  logger.error(err?.stack || err);
  const { statusCode, body } = normalizeError(err);
  return res.status(statusCode).json(body);
}

