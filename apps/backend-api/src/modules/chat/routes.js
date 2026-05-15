// modules/chat/routes.js
import express from "express";
import { handleChat } from "./controller.js";

const router = express.Router();

// POST /api/chat
router.post("/", handleChat);

export default router;
