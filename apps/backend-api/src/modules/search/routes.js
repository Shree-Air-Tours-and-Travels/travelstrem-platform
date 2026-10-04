import express from "express";
import { authMiddleware } from "../../shared/auth/index.js";
import { globalSearch } from "./searchController.js";

const router = express.Router();

router.get("/search", authMiddleware, globalSearch);

export default router;
