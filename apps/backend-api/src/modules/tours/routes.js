import express from "express";
import { getTours, getTourByRef, getTourPricePreview, createTour, updateTour, verifyTour, deleteTour, deleteAllTours } from "./controllers/tourController.js";
import { getTourDetailsWidget } from "./controllers/widgetController.js";
import { toggleFavorite, getFavorites } from "./controllers/favoriteController.js";
import { uploadTourImage, importTourImageUrl, uploadAndAttachPhotos } from "./controllers/uploadController.js";
import { requireTourBody } from "./validators/create.validation.js";
import { requireTourUpdateBody } from "./validators/update.validation.js";
import { upload } from "../../services/cloudinary.js";
import authMiddleware from "../../shared/auth/middleware.js";
import { loadAccessContext, requirePermission } from "../tenancy/policy.js";
import { PERMISSIONS } from "../tenancy/permissions.js";
import { addDeparture, updateDeparture, removeDeparture } from "./services/departureService.js";
import Tour from "./models/Tour.js";

const router = express.Router();

// Departure management
router.post("/:id/departures", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY), async (req, res) => {
  try {
    const tour = await addDeparture(req.params.id, req.body);
    res.status(201).json({ status: "success", component: { data: { tour: tour.toObject() } }, message: "Departure added" });
  } catch (error) {
    res.status(error.status || 400).json({ status: "error", message: error.message });
  }
});

router.patch("/:id/departures/:departureId", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY), async (req, res) => {
  try {
    const tour = await updateDeparture(req.params.id, req.params.departureId, req.body);
    res.json({ status: "success", component: { data: { tour: tour.toObject() } }, message: "Departure updated" });
  } catch (error) {
    res.status(error.status || 400).json({ status: "error", message: error.message });
  }
});

router.delete("/:id/departures/:departureId", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY), async (req, res) => {
  try {
    const tour = await removeDeparture(req.params.id, req.params.departureId);
    res.json({ status: "success", component: { data: { tour: tour.toObject() } }, message: "Departure removed" });
  } catch (error) {
    res.status(error.status || 400).json({ status: "error", message: error.message });
  }
});

// GET all tours
router.get("/", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_VIEW_OWN, PERMISSIONS.TRIP_VIEW_AGENCY), getTours);        // Get all tours
router.get("/favorites", authMiddleware, getFavorites);
router.get("/:id/price", getTourPricePreview);
router.get("/:tourRef/widgets/:widgetFile.json", getTourDetailsWidget);
router.get("/:tourRef", getTourByRef);  // Get single tour by id or slug ref
router.post("/", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_CREATE), requireTourBody, createTour);     // Create new tour
router.post("/favorite/toggle", authMiddleware, toggleFavorite);
router.put("/:id", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY), requireTourUpdateBody, updateTour);   // Update tour
router.post("/:id/verify", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_UPDATE_AGENCY), verifyTour);
router.delete("/:id", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_ARCHIVE_OWN, PERMISSIONS.TRIP_ARCHIVE_AGENCY), deleteTour);// Delete tour
router.delete("/", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.AGENCY_DELETE), deleteAllTours);

// Image upload
router.post("/upload", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_CREATE), upload.single("image"), uploadTourImage);
router.post("/upload-url", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_CREATE), importTourImageUrl);
router.post("/:id/photos", authMiddleware, loadAccessContext, requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY), upload.array("images", 10), uploadAndAttachPhotos);

export default router;
