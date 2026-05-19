import express from "express";
import { getTours, getTourByRef, getTourPricePreview, createTour, updateTour, deleteTour, deleteAllTours } from "./controllers/tourController.js";
import { getTourDetailsWidget } from "./controllers/widgetController.js";
import { toggleFavorite, getFavorites } from "./controllers/favoriteController.js";
import { uploadTourImage, uploadAndAttachPhotos } from "./controllers/uploadController.js";
import { requireTourBody } from "./validators/create.validation.js";
import { requireTourUpdateBody } from "./validators/update.validation.js";
import { upload } from "../../services/cloudinary.js";

const router = express.Router();

// GET all tours
router.get("/", getTours);        // Get all tours
router.get("/favorites", getFavorites);
router.get("/:id/price", getTourPricePreview);
router.get("/:tourRef/widgets/:widgetFile.json", getTourDetailsWidget);
router.get("/:tourRef", getTourByRef);  // Get single tour by id or slug ref
router.post("/", requireTourBody, createTour);     // Create new tour
router.post("/favorite/toggle", toggleFavorite);
router.put("/:id", requireTourUpdateBody, updateTour);   // Update tour
router.delete("/:id", deleteTour);// Delete tour
router.delete("/", deleteAllTours);

// Image upload
router.post("/upload", upload.single("image"), uploadTourImage);
router.post("/:id/photos", upload.array("images", 10), uploadAndAttachPhotos);

export default router;
