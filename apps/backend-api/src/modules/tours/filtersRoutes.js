// modules/tours/filtersRoutes.js
import express from "express";
import { getFilters, applyFilters } from "./controllers/filterController.js";

const router = express.Router();

router.get("/filters.json", getFilters);
router.post("/tour-listing-updated", applyFilters);
export default router;
