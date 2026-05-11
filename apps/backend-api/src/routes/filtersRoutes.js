// server/routes/filters.routes.js
import express from "express";
import { getFilters, applyFilters } from "../modules/filters/filtersController.js";

const router = express.Router();

router.get("/filters.json", getFilters);
router.post("/filters.json/apply", applyFilters);

// If FE posts to /api/tours.json, you can alias:
// router.post("/tours.json", filtersController.applyFilters);

// router.post("/filters/apply", applyFilters);
// router.post("/tours.json", applyFilters); 
export default router;
