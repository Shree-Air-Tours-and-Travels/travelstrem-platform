import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";
import { getQuotePdfSignedUrl } from "./controllers/documentController.js";

const router = express.Router();
router.get("/:quoteId/pdf", authMiddleware, getQuotePdfSignedUrl);
export default router;
