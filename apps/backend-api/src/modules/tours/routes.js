import express from "express";
import { getTours, getTourByRef, getTourPricePreview, createTour, updateTour, deleteTour, deleteAllTours } from "./controllers/tourController.js";
import { getTourDetailsWidget } from "./controllers/widgetController.js";
import { toggleFavorite, getFavorites } from "./controllers/favoriteController.js";
import { uploadTourImage, uploadAndAttachPhotos } from "./controllers/uploadController.js";
import { requireTourBody } from "./validators/create.validation.js";
import { requireTourUpdateBody } from "./validators/update.validation.js";
import { upload } from "../../services/cloudinary.js";
import authMiddleware from "../../shared/auth/middleware.js";

const router = express.Router();

// GET all tours
router.get("/", authMiddleware, getTours);        // Get all tours
router.get("/favorites", authMiddleware, getFavorites);
router.get("/:id/price", getTourPricePreview);
router.get("/:tourRef/widgets/:widgetFile.json", getTourDetailsWidget);
router.get("/:tourRef", getTourByRef);  // Get single tour by id or slug ref
router.post("/", authMiddleware, requireTourBody, createTour);     // Create new tour
router.post("/favorite/toggle", authMiddleware, toggleFavorite);
router.put("/:id", authMiddleware, requireTourUpdateBody, updateTour);   // Update tour
router.delete("/:id", authMiddleware, deleteTour);// Delete tour
router.delete("/", authMiddleware, deleteAllTours);

// Image upload
router.post("/upload", authMiddleware, upload.single("image"), uploadTourImage);
router.post("/:id/photos", authMiddleware, upload.array("images", 10), uploadAndAttachPhotos);

export default router;
