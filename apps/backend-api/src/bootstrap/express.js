import express from "express";
import registerMiddleware from "./middleware.js";
import registerRoutes from "./routes.js";
import { errorHandler } from "../shared/middleware/index.js";

const app = express();
app.express = express;

registerMiddleware(app);
registerRoutes(app);
app.use(errorHandler);

export default app;
