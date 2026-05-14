import express from "express";
import { getTours, getTourByRef, createTour, updateTour, deleteTour, deleteAllTours} from "../modules/tours/tourController.js";

const router = express.Router();

// GET all tours
router.get("/", getTours);        // Get all tours
router.get("/:tourRef", getTourByRef);  // Get single tour by id or slug ref
router.post("/", createTour);     // Create new tour
router.put("/:id", updateTour);   // Update tour
router.delete("/:id", deleteTour);// Delete tour
router.delete("/", deleteAllTours);

export default router;
