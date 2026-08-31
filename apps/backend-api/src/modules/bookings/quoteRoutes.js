import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";
import {
    downloadQuotePdf,
    getQuotePdfSignedUrl,
} from "./controllers/documentController.js";

const router = express.Router();
router.get("/:quoteId/pdf", authMiddleware, getQuotePdfSignedUrl);
router.get("/:quoteId/pdf/file", authMiddleware, downloadQuotePdf);
export default router;
