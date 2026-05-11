import express from "express";
import { getServices } from "../modules/services/serviceController.js";

const router = express.Router();

router.get("/", getServices);

export default router;
