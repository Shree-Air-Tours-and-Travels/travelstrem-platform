import express from "express";
import { getToursPage, getTourDetailsPage } from "./controllers/pageController.js";
import { getWidget } from "./controllers/widgetController.js";

const router = express.Router();

router.get("/tours-page.json", getToursPage);
router.get("/tour-details-page.json", getTourDetailsPage);
router.get("/:widgetFile.json", getWidget);

export default router;
