import express from "express";
import { resolveLocation, suggestLocations } from "./location.controller.js";

const router = express.Router();

router.get("/suggestions", suggestLocations);
router.get("/places/:placeId", resolveLocation);

export default router;
