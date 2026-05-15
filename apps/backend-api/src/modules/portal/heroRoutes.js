import express from "express";
import { getHero, createHero } from "./controllers/heroController.js";

const router = express.Router();

router.get("/", getHero);
router.post("/", createHero);

export default router;
