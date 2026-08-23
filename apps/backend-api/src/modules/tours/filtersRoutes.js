// modules/tours/filtersRoutes.js
import express from "express";
import { getFilters } from "./controllers/filterController.js";
import {
    getTourDiscoveryController,
    postLegacyTourSearch,
    postTourSearch,
} from "./controllers/searchController.js";
import { requireTourSearchBody } from "./validators/search.validation.js";

const router = express.Router();

router.get("/filters.json", getFilters);
router.get("/tours/discovery", getTourDiscoveryController);
router.post("/tours/search", requireTourSearchBody, postTourSearch);
// Compatibility for older Trevista clients; delegates to the same canonical search service.
router.post("/tour-listing-updated", postLegacyTourSearch);
export default router;
