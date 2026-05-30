export { default as ApiError } from "./ApiError.js";

export function normalizeError(err) {
  const statusCode = err?.statusCode || err?.status || 500;
  return {
    statusCode,
    body: {
      status: "error",
      message: err?.message || "Internal Server Error",
      ...(err?.details ? { details: err.details } : {}),
    },
  };
}

