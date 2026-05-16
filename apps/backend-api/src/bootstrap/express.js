import express from "express";
import registerMiddleware from "./middleware.js";
import registerRoutes from "./routes.js";
import pageContractValidator from "../middleware/pageContractValidator.js";

const app = express();
app.express = express;

registerMiddleware(app);
app.use(pageContractValidator);
registerRoutes(app);

app.use((err, req, res, next) => {
  if (err?.message?.startsWith("CORS blocked:")) {
    return res.status(403).json({ status: "error", message: err.message });
  }
  console.error(err?.stack || err);
  return res.status(err.status || 500).json({ status: "error", message: err.message || "Internal Server Error" });
});

export default app;
