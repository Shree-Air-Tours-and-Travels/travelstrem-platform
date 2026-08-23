import express from "express";
import { getTrevistaHome } from "./controllers/trevistaController.js";

const router = express.Router();

router.get("/home.json", getTrevistaHome);

export default router;
