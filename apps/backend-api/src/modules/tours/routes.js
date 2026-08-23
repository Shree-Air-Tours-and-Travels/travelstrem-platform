import express from "express";
import {
    getTours,
    getTourByRef,
    getTourPricePreview,
    calculateTourPackage,
    previewTourCustomization,
    updateTour,
    verifyTour,
    deleteTour,
    deleteAllTours,
} from "./controllers/tourController.js";
import { getTourDetailsWidget } from "./controllers/widgetController.js";
import { toggleFavorite, getFavorites } from "./controllers/favoriteController.js";
import {
    uploadTourImage,
    importTourImageUrl,
    uploadAndAttachPhotos,
} from "./controllers/uploadController.js";
import { requireTourUpdateBody } from "./validators/update.validation.js";
import { upload } from "../../services/cloudinary.js";
import authMiddleware from "../../shared/auth/middleware.js";
import { loadAccessContext, requirePermission } from "../tenancy/policy.js";
import { PERMISSIONS } from "../tenancy/permissions.js";
import { addDeparture, updateDeparture, removeDeparture } from "./services/departureService.js";
import Tour from "./models/Tour.js";
import {
    getTourProcessDefinition,
    processTourAction,
} from "./controllers/tourProcessController.js";
import {
    getBuilderDefinition,
    getBuilderStep,
    getBuilderTemplate,
    previewBuilderPricing,
    saveBuilderStep,
    updateBuilderPosition,
} from "./builder/tourBuilder.controller.js";

const router = express.Router();

// Shared, backend-driven tour builder (consumed by admin + agent portals).
// Declared before "/:tourRef" so step keys never match the catch-all.
const builderPermission = requirePermission(
    PERMISSIONS.TRIP_CREATE,
    PERMISSIONS.TRIP_UPDATE_OWN,
    PERMISSIONS.TRIP_UPDATE_AGENCY,
);
router.get(
    "/builder/definition",
    authMiddleware,
    loadAccessContext,
    builderPermission,
    getBuilderDefinition,
);
router.get(
    "/builder/template",
    authMiddleware,
    loadAccessContext,
    builderPermission,
    getBuilderTemplate,
);
router.get(
    "/builder/steps/:stepKey",
    authMiddleware,
    loadAccessContext,
    builderPermission,
    getBuilderStep,
);
router.patch(
    "/builder/steps/:stepKey",
    authMiddleware,
    loadAccessContext,
    builderPermission,
    saveBuilderStep,
);
router.patch(
    "/builder/position",
    authMiddleware,
    loadAccessContext,
    builderPermission,
    updateBuilderPosition,
);
router.post(
    "/builder/pricing-preview",
    authMiddleware,
    loadAccessContext,
    builderPermission,
    previewBuilderPricing,
);

// Departure management
router.post(
    "/:id/departures",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY),
    async (req, res) => {
        try {
            const tour = await addDeparture(req.params.id, req.body);
            res.status(201).json({
                status: "success",
                component: { data: { tour: tour.toObject() } },
                message: "Departure added",
            });
        } catch (error) {
            res.status(error.status || 400).json({ status: "error", message: error.message });
        }
    },
);

router.patch(
    "/:id/departures/:departureId",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY),
    async (req, res) => {
        try {
            const tour = await updateDeparture(req.params.id, req.params.departureId, req.body);
            res.json({
                status: "success",
                component: { data: { tour: tour.toObject() } },
                message: "Departure updated",
            });
        } catch (error) {
            res.status(error.status || 400).json({ status: "error", message: error.message });
        }
    },
);

router.delete(
    "/:id/departures/:departureId",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY),
    async (req, res) => {
        try {
            const tour = await removeDeparture(req.params.id, req.params.departureId);
            res.json({
                status: "success",
                component: { data: { tour: tour.toObject() } },
                message: "Departure removed",
            });
        } catch (error) {
            res.status(error.status || 400).json({ status: "error", message: error.message });
        }
    },
);

// GET all tours
router.get(
    "/process/definition",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_CREATE),
    getTourProcessDefinition,
);
router.post(
    "/process/action",
    authMiddleware,
    loadAccessContext,
    requirePermission(
        PERMISSIONS.TRIP_CREATE,
        PERMISSIONS.TRIP_UPDATE_OWN,
        PERMISSIONS.TRIP_UPDATE_AGENCY,
    ),
    processTourAction,
);
router.get(
    "/",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_VIEW_OWN, PERMISSIONS.TRIP_VIEW_AGENCY),
    getTours,
); // Get all tours
router.get("/favorites", authMiddleware, getFavorites);
router.post(
    "/:id/calculate",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_VIEW_OWN, PERMISSIONS.TRIP_VIEW_AGENCY),
    calculateTourPackage,
);
router.get("/:id/price", getTourPricePreview);
router.post("/:id/customization-preview", previewTourCustomization);
router.get("/:tourRef/widgets/:widgetFile.json", getTourDetailsWidget);
router.get("/:tourRef", getTourByRef); // Get single tour by id or slug ref
router.post("/favorite/toggle", authMiddleware, toggleFavorite);
router.put(
    "/:id",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY),
    requireTourUpdateBody,
    updateTour,
); // Update tour
router.post(
    "/:id/verify",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_UPDATE_AGENCY),
    verifyTour,
);
router.delete(
    "/:id",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_ARCHIVE_OWN, PERMISSIONS.TRIP_ARCHIVE_AGENCY),
    deleteTour,
); // Delete tour
router.delete(
    "/",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.AGENCY_DELETE),
    deleteAllTours,
);

// Image upload
router.post(
    "/upload",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_CREATE),
    upload.single("image"),
    uploadTourImage,
);
router.post(
    "/upload-url",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_CREATE),
    importTourImageUrl,
);
router.post(
    "/:id/photos",
    authMiddleware,
    loadAccessContext,
    requirePermission(PERMISSIONS.TRIP_UPDATE_OWN, PERMISSIONS.TRIP_UPDATE_AGENCY),
    upload.array("images", 10),
    uploadAndAttachPhotos,
);

export default router;
