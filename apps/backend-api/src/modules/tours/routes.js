import express from "express";
import { getTours, getTourByRef, createTour, updateTour, deleteTour, deleteAllTours } from "./controllers/tourController.js";
import { getTourDetailsWidget } from "./controllers/widgetController.js";
import { requireTourBody } from "./validators/create.validation.js";
import { requireTourUpdateBody } from "./validators/update.validation.js";

const router = express.Router();

// GET all tours
router.get("/", getTours);        // Get all tours
router.get("/:tourRef/widgets/:widgetFile.json", getTourDetailsWidget);
router.get("/:tourRef", getTourByRef);  // Get single tour by id or slug ref
router.post("/", requireTourBody, createTour);     // Create new tour
router.put("/:id", requireTourUpdateBody, updateTour);   // Update tour
router.delete("/:id", deleteTour);// Delete tour
router.delete("/", deleteAllTours);

export default router;
