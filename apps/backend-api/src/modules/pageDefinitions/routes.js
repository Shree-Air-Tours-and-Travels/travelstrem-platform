import express from "express";
import { getPageDefinition, getPageRegistry } from "./pageDefinitionController.js";

const router = express.Router();

router.get("/", getPageRegistry);
router.get("/key/:pageKey", getPageDefinition);
router.get("/:app/:page", getPageDefinition);

export default router;
