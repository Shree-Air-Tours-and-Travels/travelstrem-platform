import express from "express";
import { getDashboardWidget, getPageDefinition, getPageRegistry } from "./pageDefinitionController.js";

const router = express.Router();

router.get("/", getPageRegistry);
router.get("/key/:pageKey", getPageDefinition);
router.get("/:app/:page/widgets/:widgetKey", getDashboardWidget);
router.get("/:app/:page", getPageDefinition);

export default router;
