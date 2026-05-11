// routes/chatRoutes.js
import express from "express";
import  {handleChat } from "../modules/chat/chatController.js";

const router = express.Router();

// POST /api/chat
router.post("/", handleChat);

export default router;
